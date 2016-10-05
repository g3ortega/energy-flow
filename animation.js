// SETTINGS
var mMaxParticlePathOffset = 40;
var mMinParticlePathOffset = 2;
var mPathMaxMouseDistance = 200;
var mPathMouseSmoothing = 5;
var mBlackLineWidth = 20;
var mColorLineWidth = 1.5;

var mLineCount;// 6
var mParticlesPerLine;// 42

if (window.innerWidth <= 360) {
    // mobile
    mLineCount = 4;
    mParticlesPerLine = 20;
} else {
    // desktop
    mLineCount = 6;
    mParticlesPerLine = 36;
}

// 'exports'
function createDefaultSettings() {
    return {
        timeScale: 1,
        hue: 327
    }
}
function applySettings(s, d) {
    TweenMax.to(window.Animation, d, {timeScale: s.timeScale});

    lines.forEach(function (l) {
        if (l.lockColor) {
            changeColor(l.shape.fillColor, s.hue, d, s.lightness);
        }
    });
}

function changeColor(c, h, d, l) {
    var tl = new TimelineMax();
    tl.to(c, d * 0.5, {lightness: 0});
    tl.to(c, 0, {hue: h});
    tl.to(c, d * 0.5, {lightness: l});
}

window.Animation = {};
window.Animation.timeScale = .5;
window.Animation.defaultTransitionDuration = .3;
window.Animation.defaultEase = Quint.easeInOut;
window.Animation.settings = {};
window.Animation.settings.energy = createDefaultSettings();

window.Animation.settings.energy.timeScale = .85;
window.Animation.settings.energy.hue = 120;
window.Animation.settings.energy.lightness = randomRange(0.20, 0.40);




// window.Animation.setSlimState = function (duration) {
//     duration = duration || window.Animation.defaultTransitionDuration;
//     avoidAntiMouse = false;
//     applySettings(window.Animation.settings.slim, duration);
//     setSlimPath(duration);
// };
window.Animation.setEnergyState = function (duration) {
    duration = duration || window.Animation.defaultTransitionDuration;
    avoidAntiMouse = false;
    applySettings(window.Animation.settings.energy, duration);
    setEnergyPath(duration);
};

function MotionPath(path) {
    this.path = path;
    this.smoothing = mPathMouseSmoothing;
    this.maxDist = mPathMaxMouseDistance;
    this.amplitudeDelta = randomRange(4, 8);
    this.amplitudeDeltaSpeed = Math.random() * 0.03;
    this.amplitudeTime = Math.random() * Math.PI * 2;
    this.processPath();
}
MotionPath.prototype = {
    processPath: function () {
        var s;
        for (var i = 0; i < this.path.segments.length; i++) {
            s = this.path.segments[i];
            s._fixed = i === 0 || i === (this.path.segments.length - 1);
            s._anchor = s.point.clone();
        }
    },
    update: function () {
        this.amplitudeTime += this.amplitudeDeltaSpeed;
        this.path.segments.forEach(function (s) {
            if (s._fixed === false) {
                s.point.y += Math.sin(this.amplitudeTime) * this.amplitudeDelta * s._directionY;
                this.avoidPoint(s, mouse);
                if (avoidAntiMouse === true) {
                    this.avoidPoint(s, antiMouse);
                }
            }
            else {
                s.point.set(s._anchor.x, s._anchor.y);
            }
        }, this);
        this.path.smooth();
    },
    avoidPoint: function (s, p) {
        var mouseToPoint = s.point - p,
            anchorToPoint = s._anchor - s.point;
        if (mouseToPoint.length < this.maxDist) {
            mouseToPoint *= 1 - (mouseToPoint.length / this.maxDist);
        }
        else {
            mouseToPoint *= 0;
        }
        s.point += (anchorToPoint + mouseToPoint) / this.smoothing;
    }
};
function Particle(symbol, path) {
    var scale = randomRange(0.05, .65);
    this.symbol = symbol;
    this.symbol.scale(scale, scale);
    this.path = path;
    this.t = 0;
    this.speed = (2 - scale) * .55;
    this.rotationSpeed = (2 - scale) * 5;
    var offsetX = randomRange(mMinParticlePathOffset, mMaxParticlePathOffset) * (Math.random() > 0.5 ? 1 : -1);
    var offsetY = randomRange(mMinParticlePathOffset, mMaxParticlePathOffset) * (Math.random() > 0.5 ? 1 : -1);
    this.pathOffset = new Point(offsetX, offsetY);
}
Particle.prototype = {
    update: function (dt) {
        this.t += (this.speed * dt * Animation.timeScale);
        this.t %= (this.path.segments.length - 1);
        this.symbol.position = this.path.getPointAt(this.t, true) + this.pathOffset;
        this.symbol.rotation += this.rotationSpeed * Animation.timeScale;
    }
};
function Line(path, width, range, color, lockColor) {
    this.path = path;
    this.width = width;
    this.range = range;
    this.color = color;
    this.lockColor = lockColor;

    var path0 = this.path.clone();
    var path1 = this.path.clone();

    path0.join(path1);
    path0.fillColor = this.color;
    path0.opacity = randomRange(.5, .8);

    for (var i = 0; i < path0.segments.length; i++) {
        var x = randomRange(-range[0], range[0]);
        var y = randomRange(-range[1], range[1]);
        path0.segments[i]._offset = new Point(x, y);
        path0.segments[i]._time = Math.random() * (Math.PI * 2);
        path0.segments[i]._dt = Math.random() / 30;
    }

    path0.closed = true;
    path0.smooth();
    path0.segments[0].handleIn.set(0, 0);
    path0.segments[mSegmentCount].handleIn.set(0, 0);

    this.shape = path0;
}
Line.prototype = {
    update: function () {
        var pathPoint, segment0, segment1,
            width;
        for (var i = 1; i < this.path.segments.length - 1; i++) {
            segment0 = this.shape.segments[i];
            segment1 = this.shape.segments[mSegmentCount - i + mSegmentCount];
            segment0._time += segment0._dt * Animation.timeScale;
            pathPoint = this.path.segments[i].point;
            width = (this.width * Math.sin(segment0._time));
            segment0.point.x = pathPoint.x;
            segment0.point.y = pathPoint.y - width * (i % 2 ? -1 : 1);
            segment0.point += segment0._offset;
            segment1.point.x = pathPoint.x;
            segment1.point.y = pathPoint.y + width * ((mSegmentCount - i + mSegmentCount) % 2 ? -1 : 1);
            segment1.point += segment1._offset;
        }
        this.shape.segments[0].point.set(
            this.path.segments[0].point.x,
            this.path.segments[0].point.y
        );
        this.shape.segments[mSegmentCount].point.set(
            this.path.segments[mSegmentCount].point.x,
            this.path.segments[mSegmentCount].point.y
        );
        this.shape.smooth();
    }



};
var blobParticleSVG = project.importSVG('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="22px" height="22px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve"><path fill="#1D1E1B" d="M16.632,0.391c-5.594-0.521-5.044,6.127-7.285,8.553c-2.244,2.435-9.258-0.319-9.101,6.051c0.167,6.375,6.018,4.595,8.438,7.248c2.415,2.664,1.101,9.41,6.779,9.396c5.692-0.012,4.278-6.476,6.918-8.954c2.646-2.477,9.117-0.48,9.369-6.184c0.244-5.713-6.363-4.044-8.551-6.55C21.016,7.458,22.227,0.922,16.632,0.391"></path></svg>');
blobParticleSVG.visible = false;
blobParticleSVG = blobParticleSVG.children[0];
var centerY = view.size.height * 0.5,
    mouse = new Point(),
    antiMouse = new Point();
var avoidAntiMouse = false;
var paths = [];
var particles = [];
var lines = [];
var particleShapes = [];
var mSegmentCount = 8;

createPaths();

function createPaths() {
    var path,
        motionPath;

    for (var i = 0; i < mLineCount; i++) {
        path = new Path();

        for (var j = 0; j <= mSegmentCount; j++) {
            path.add(new Point(view.size.width * (j / mSegmentCount), view.size.height * 0.5));
        }

        motionPath = new MotionPath(path);

        createParticles(motionPath);

        if (i % 2) {
            createBigLine(motionPath);
        }
        else {
            createSmallLine(motionPath);
        }

        paths.push(motionPath);
    }
}

function setEnergyPath(duration) {
    var path,
        l = paths.length;

    var amplitude, delta, directionY;
    var tl = new TimelineMax();

    var xOffset,
        amplitudeScale;

    if (view.size.width < view.size.height) {
        xOffset = 12;
        amplitudeScale = 0.75;
    }
    else {
        xOffset = 24;
        amplitudeScale = 1;
    }

    for (var i = 0; i < l; i++) {
        path = paths[i];
        amplitude = randomRange(view.size.height * 0.075, view.size.height * 0.15) * amplitudeScale;
        delta = view.size.width / mSegmentCount;

        for (var j = 0; j <= mSegmentCount; j++) {
            var x, y;

            if (j === 0) {
                x = -8;
                y = centerY;
            }
            else if (j === mSegmentCount) {
                x = view.size.width + 8;
                y = centerY;
            }
            else {
                directionY = (j % 2 === 0 ? 1 : -1);
                x = j * delta + randomRange(-xOffset, xOffset);
                y = centerY + amplitude * directionY;
            }

            path.path.segments[j]._directionY = directionY || 0;
            tl.to(path.path.segments[j]._anchor, duration, {x: x, y: y, ease: Animation.defaultEase}, 0);
        }
    }
}


function createParticles(path) {
    var particleShape;

    if (Math.random() > 0.5) {
        particleShape = new Path.Circle(new Point(), 10);
    }
    else {
        particleShape = blobParticleSVG.clone();
        particleShape.visible = true;
    }

    particleShapes.push(particleShape);

    var particleSymbol = new Symbol(particleShape);

    particleShape.opacity = .9;
    particleShape.fillColor = '#caa93c';
    particleShape.fillColor.saturation = randomRange(.2, 1);
    particleShape.fillColor.lightness = randomRange(0.5, 0.65);
    particleShape.rasterize();

    for (var i = 0; i < mParticlesPerLine; i++) {

        var s = particleSymbol.place(),
            p = new Particle(s, path.path);

        p.t = Math.random() * mSegmentCount;
        particles.push(p);
    }
}

function createBigLine(path) {
    var range;

    if (view.size.width < view.size.height) {
        range = [10, 5];
    }
    else {
        range = [40, 10];
    }

    lines.push(new Line(path.path, mBlackLineWidth, range, '#144CA4', true));
}

function createSmallLine(path) {
    lines.push(new Line(path.path, mColorLineWidth, [0, 0], '#ad8f9e', false));
}

function onFrame(e) {
    paths.forEach(function (p) {
        p.update();
    });
    particles.forEach(function (p) {
        p.update(e.delta);
    });
    lines.forEach(function (p) {
        p.update(e.delta);
    });
}

function onMouseMove(e) {
    mouse = e.point;
    antiMouse = mouse * -1 + view.size;
}

function randomRange(min, max) {
    return min + (max - min) * Math.random();
}

// for testing
var animIndex = 0,
    anims = 5;

function onMouseUp(e) {
    window.Animation.setEnergyState();
}

window.Animation.setEnergyState(0);