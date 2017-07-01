var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
        //console.log("created particle", this);
    }
    Vector.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };
    Vector.prototype.mult = function (n) {
        this.x = this.x * n;
        this.y = this.y * n;
        return this;
    };
    Vector.prototype.normalize = function () {
        var l = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = this.x / l;
        this.y = this.y / l;
        return this;
    };
    Vector.random = function () {
        return new Vector(Math.floor(Math.random() * 100), Math.floor(Math.random() * 100));
    };
    return Vector;
}());
var Particle = (function () {
    function Particle() {
        this.velocity = Vector.random().add(new Vector(-50, -50)).normalize().mult(3);
        this.maxRadius = 4;
        this.minRadius = 1;
        this.shrinkingFactor = 0.99;
        this.age = 0;
        this.maxAge = 300;
        this.isBouncing = false;
        this.position = new Vector(config.mousePosition.x, config.mousePosition.y);
        this.radius = Math.floor(Math.random() * this.maxRadius) + this.minRadius;
    }
    Particle.prototype.draw = function (ctx) {
        if (this.age < this.maxAge) {
            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            //console.log("drw part");
        }
    };
    Particle.prototype.tick = function () {
        this.age++;
        // change velocity
        if (this.position.y >= config.height - config.floorHeight && this.isBouncing == false) {
            this.velocity.y = this.velocity.y * -1 * config.bounceFriction;
            this.isBouncing = true;
        }
        else {
            this.isBouncing = false;
        }
        // 1. Gravity:
        this.velocity.add(config.gravity);
        // apply movement
        this.position.add(this.velocity);
        this.radius = this.radius * this.shrinkingFactor;
    };
    return Particle;
}());
var ParticleSystem = (function () {
    function ParticleSystem() {
        this.particles = [];
        this._addParticle = function () {
            this.addParticle();
        }.bind(this);
        this.addParticle();
    }
    ParticleSystem.prototype.draw = function (ctx) {
        for (var i = 0; i < this.particles.length; ++i) {
            this.particles[i].draw(ctx);
        }
    };
    ParticleSystem.prototype.addParticle = function () {
        this.particles.push(new Particle());
    };
    ParticleSystem.prototype.tick = function () {
        for (var i = 0; i < this.particles.length; ++i) {
            this.particles[i].tick();
        }
    };
    return ParticleSystem;
}());
var Game = (function () {
    function Game() {
        this.canvas = document.getElementById('c');
        this.canvas.width = config.width;
        this.canvas.height = config.height;
        this.context = this.canvas.getContext('2d');
        this.canvas.addEventListener('mousemove', function (evt) {
            config.mousePosition = this.getMousePos(this.canvas, evt);
        }.bind(this), false);
        this.particleSystem = new ParticleSystem();
    }
    Game.prototype.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return new Vector(evt.clientX - rect.left, evt.clientY - rect.top);
    };
    Game.prototype.draw = function () {
        this.context.clearRect(0, 0, config.width, config.height);
        this.particleSystem.draw(this.context);
    };
    Game.prototype.tick = function () {
        this.particleSystem.tick();
    };
    return Game;
}());
var config = {
    gravity: new Vector(0, 0.1),
    width: 500,
    height: 500,
    bounceFriction: 0.8,
    mousePosition: new Vector(100, 100),
    floorHeight: 100
};
var g = new Game();
function loop() {
    requestAnimationFrame(loop);
    g.tick();
    g.draw();
}
loop();
setInterval(g.particleSystem._addParticle, 50);
