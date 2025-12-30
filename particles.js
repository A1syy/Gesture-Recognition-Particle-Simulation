class Particle {
  constructor(x, y) {
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.target = { x, y };
  }

  update() {
    this.vel.x += (this.target.x - this.pos.x) * 0.01;
    this.vel.y += (this.target.y - this.pos.y) * 0.01;
    this.vel.x *= 0.85;
    this.vel.y *= 0.85;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }

  draw(ctx, size = 3) {
    ctx.fillRect(this.pos.x, this.pos.y, size, size);
  }
}

class ParticleSystem {
  constructor(count, w, h) {
    this.particles = Array.from(
      { length: count },
      () => new Particle(Math.random() * w, Math.random() * h)
    );
  }

  setTargets(targets) {
    this.particles.forEach((p, i) => {
      p.target = targets[i % targets.length];
    });
  }

  update(ctx, currentState) {
    // Use cached particle size for better performance
    const pSize =
      typeof getCachedParticleSize === "function" ? getCachedParticleSize() : 3;

    const particles = this.particles;
    const len = particles.length;

    if (currentState === "TEXT" || currentState === "TEXT_CUSTOM") {
      // Colorful effect for text - use fewer color changes
      const time = Date.now() * 0.003;
      const baseHue = (time * 50) % 360;

      // Pre-set color and batch draw
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        p.update();
        // Change color every 200 particles instead of 100
        if (i % 200 === 0) {
          const colorGroup = Math.floor(i / 200);
          const hue = (colorGroup * 40 + baseHue) % 360;
          ctx.fillStyle = `hsl(${hue}, 60%, 45%)`;
        }
        p.draw(ctx, pSize);
      }
    } else if (currentState === "FIREWORKS") {
      // Fireworks - batch by explosion
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        p.update();
        if (p.target.explosionIndex !== undefined) {
          const explosion =
            typeof fireworksData !== "undefined"
              ? fireworksData[p.target.explosionIndex]
              : null;
          if (explosion) {
            const opacity = p.target.opacity || 1;
            if (opacity > 0.05) {
              // Higher threshold
              ctx.globalAlpha = opacity;
              ctx.fillStyle = `hsl(${explosion.hue}, 80%, 60%)`;
              p.draw(ctx, pSize);
            }
          }
        }
      }
      ctx.globalAlpha = 1.0;
    } else if (currentState === "STAR") {
      ctx.fillStyle = "#FFD700";
      for (let i = 0; i < len; i++) {
        particles[i].update();
        particles[i].draw(ctx, pSize);
      }
    } else if (currentState === "LOVE") {
      ctx.fillStyle = "#FF1493";
      for (let i = 0; i < len; i++) {
        particles[i].update();
        particles[i].draw(ctx, pSize);
      }
    } else if (currentState === "SPHERE") {
      ctx.fillStyle = "#00BFFF";
      for (let i = 0; i < len; i++) {
        particles[i].update();
        particles[i].draw(ctx, pSize);
      }
    } else {
      ctx.fillStyle = "white";
      for (let i = 0; i < len; i++) {
        particles[i].update();
        particles[i].draw(ctx, pSize);
      }
    }
  }
}
