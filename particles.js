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

    if (currentState === "TEXT" || currentState === "TEXT_CUSTOM") {
      // Colorful blinking effect for text with grouped colors
      const time = Date.now() * 0.003;
      this.particles.forEach((p, i) => {
        p.update();
        // Group particles in chunks of 100 for uniform color regions
        const colorGroup = Math.floor(i / 100);
        const hue = (colorGroup * 30 + time * 50) % 360;
        ctx.fillStyle = `hsl(${hue}, 60%, 45%)`;
        p.draw(ctx, pSize);
      });
    } else if (currentState === "FIREWORKS") {
      // Fireworks - solid color per explosion
      this.particles.forEach((p, i) => {
        p.update();
        if (p.target.explosionIndex !== undefined) {
          const explosion = fireworksData[p.target.explosionIndex];
          if (explosion) {
            const opacity = p.target.opacity || 1;
            // Only draw if opacity is above threshold
            if (opacity > 0.01) {
              ctx.globalAlpha = opacity;
              ctx.fillStyle = `hsl(${explosion.hue}, 80%, 60%)`;
              p.draw(ctx, pSize);
              ctx.globalAlpha = 1.0; // Reset
            }
          } else {
            ctx.fillStyle = "white";
            p.draw(ctx, pSize);
          }
        } else {
          ctx.fillStyle = "white";
          p.draw(ctx, pSize);
        }
      });
    } else if (currentState === "STAR") {
      // Yellow/gold particles for star
      ctx.fillStyle = "#FFD700";
      this.particles.forEach((p) => {
        p.update();
        p.draw(ctx, pSize);
      });
    } else if (currentState === "LOVE") {
      // Pink particles for heart
      ctx.fillStyle = "#FF1493";
      this.particles.forEach((p) => {
        p.update();
        p.draw(ctx, pSize);
      });
    } else if (currentState === "SPHERE") {
      // Blue particles for sphere
      ctx.fillStyle = "#00BFFF";
      this.particles.forEach((p) => {
        p.update();
        p.draw(ctx, pSize);
      });
    } else {
      // Default white
      ctx.fillStyle = "white";
      this.particles.forEach((p) => {
        p.update();
        p.draw(ctx, pSize);
      });
    }
  }
}
