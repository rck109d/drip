/*global window, document, setTimeout, clearTimeout, $ */
/*jshint unused:true, undef: true, eqnull:true */
;(function(){
    "use strict";
    var screenScale = 5;
    var numDrops = document.getElementById("numDrops");
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(0, 0, 255)";
    var w, h, hitIndex;
    var drops = [];
    var sprinklers = [];
    function setupCanvas() {
        canvas.width = document.body.clientWidth-20;
        canvas.height = document.body.clientHeight-200;
        w = Math.floor(canvas.width/screenScale);
        h = Math.floor(canvas.height/screenScale);
        hitIndex = [];
        for(var y=0; y<h; y++) {
            hitIndex.push(new Array(w));
        }
        sprinklers = [];
        onSprinklersChange();
        drops=[];
    }
    setupCanvas();
    
    function mainLoop() {
        sprinklers.forEach(function(sprinkler) {
            var x = sprinkler.x-5+Math.round(Math.random()*10);
            var y = sprinkler.y-5+Math.round(Math.random()*10);
            if(x>=0 && x<w && y>=0 && y<h) {
                if(!hitIndex[y][x]) {
                    drops.push({x:x, y:y, dx:0,dy:0});
                }
            }
        });
        
        drops.forEach(function(drop) {
            ctx.clearRect (drop.x*screenScale, drop.y*screenScale, screenScale, screenScale);
        });
        
        ctx.fillStyle = "rgb(0, 0, 255)";
        for(var i=0; i<drops.length; i++) {
            var toKill = false;
            var drop = drops[i];
            var oldX = drop.x;
            var oldY = drop.y;

            if(drop.dx !== 0 && Math.random()<0.9) {
                var direction = drop.dx>0?1:-1;
                var xx = 0;
                while(xx != drop.dx) {
                    var checkX = drop.x+xx+direction;
                    if(checkX<0 || checkX>=w) {
                        toKill = true;
                        break;
                    }
                    if(hitIndex[oldY][checkX]===1) {
                        drop.dx = 0;
                        break;
                    }
                    xx += direction;
                }
                drop.x+=xx;
            }

            drop.dy += 1;
            var yy=0;
            var yDirection = drop.dy>0?1:-1;
            while(yy != drop.dy) {
                var checkY = drop.y+yy+yDirection;
                if(checkY<0 || checkY>=h) {
                    toKill = true;
                    break;
                }
                if(hitIndex[checkY][drop.x]===1) {
                    drop.dy = 0;
                    //the below code would allow a random bounceback from 20%-80%
                    //drop.dy = -Math.round(drop.dy*(0.2+Math.random()*0.6));
                    if(drop.dx === 0) {
                        drop.dx = Math.random()<0.5?1:-1;
                    }
                    break;
                }
                yy+=yDirection;
            }
            drop.y+=yy;

            hitIndex[oldY][oldX]=0;
            if(toKill){
                drops.splice(i,1);
                i--;
            } else {
                ctx.fillRect (drop.x*screenScale, drop.y*screenScale, screenScale, screenScale);
                hitIndex[drop.y][drop.x]=1;
            }
        }
        numDrops.innerHTML = drops.length;
    }

    function onSprinklersChange() {
        document.getElementById("numSprinklers").innerHTML = sprinklers.length;
    }

    function togglePlay() {
        var pausedElement = document.getElementById("paused");
        if(togglePlay.interval) {
            clearInterval(togglePlay.interval);
            delete togglePlay.interval;
            pausedElement.style.display = "";
        } else {
            togglePlay.interval = setInterval(function(){mainLoop();}, 24);
            pausedElement.style.display = "none";
        }
    }
    togglePlay(); // get things started

    function paint(x,y) {
        if(x<0||x>=w||y<0||y>=h) {
            return;
        }
        if(mouseMode==1) {
            ctx.fillStyle = "rgb(255, 0, 0)";
            ctx.fillRect(x*screenScale, y*screenScale, screenScale, screenScale);
            hitIndex[y][x]=1;
        } else if (mouseMode==2) {
            ctx.clearRect(x*screenScale, y*screenScale, screenScale, screenScale);
            hitIndex[y][x]=0;
        }
    }

    function randomLine() {
        var x0=Math.round(Math.random()*w);
        var y0=Math.round(Math.random()*h);
        var x1=Math.round(Math.random()*w);
        var y1=Math.round(Math.random()*h);
        //Bresenham line algorithm
        var dx=Math.abs(x1-x0);
        var dy=Math.abs(y1-y0);
        var sx=x0<x1?1:-1;
        var sy=y0<y1?1:-1;
        var err=dx-dy;
        while(true) {
            paint(x0,y0);
            if(x0==x1&&y0==y1) { break; }
            var e2=2*err;
            if (e2>-dy){
                x0+=sx;
                err-=dy;
            }
            if(x0==x1&&y0==y1) {
                paint(x0,y0);
                break;
            }
            if(e2<dx) {
                y0+=sy;
                err+=dx;
            }
        }
    }
    window.randomLine = randomLine;

    var mouseMode = 1; // 1-draw, erase, sprinkler
    var mouseModeStyle = 1; // 1-pencil, 2-rectangle
    var drawRectFirstPos = null;
    var mousePainting = false;
    var oldMouseX = null;
    var oldMouseY = null;
    
    function toolEnd(e) {
        if(mousePainting && mouseModeStyle===2) {
            var x = Math.round(e.x/screenScale);
            var y = Math.round((e.y+window.pageYOffset)/screenScale);
            paintRect(drawRectFirstPos.x, drawRectFirstPos.y, x, y);
            mousePainting = false;
        }
        mousePainting = false;
        oldMouseX = null;
        oldMouseY = null;
    }
    
    function paintRect(x1, y1, x2, y2) {
        var minX = Math.min(x1, x2);
        var minY = Math.min(y1, y2);
        var maxX = Math.max(x1, x2);
        var maxY = Math.max(y1, y2);
        for(var xx=minX; xx<=maxX; xx++) {
            for(var yy=minY; yy<=maxY; yy++) {
                paint(xx, yy);
            }
        }
    }
    
    function toolStart(e) {
        var x = Math.round(e.clientX/screenScale);
        var y = Math.round((e.clientY+window.pageYOffset)/screenScale);
        if(mouseMode===1 || mouseMode===2) {
            mousePainting = true;
            if(mouseModeStyle===2) {
                drawRectFirstPos = {x:x, y:y};
            } else {
                paint(x, y);
            }
        } else if(mouseMode===3) {
            sprinklers.push({x:x, y:y});
            onSprinklersChange();
        }
    }
    
    function toolMove(e) {
        var x = Math.round(e.clientX/screenScale);
        var y = Math.round((e.clientY+window.pageYOffset)/screenScale);
        if(mousePainting && mouseModeStyle===1) {
            if(x>=0 && x<w && y>=0 && y<h){
                if(oldMouseX===null || oldMouseY===null) {
                    oldMouseX = x;
                    oldMouseY = y;
                }
                paintRect(oldMouseX, oldMouseY, x, y);
                oldMouseX = x;
                oldMouseY = y;
            } else {
                mousePainting = false;
            }
        }
    }
    
    canvas.addEventListener("mousedown", function (e) { toolStart(e); }, false);
    canvas.addEventListener("mouseup", function (e) { toolEnd(e); }, false);
    canvas.addEventListener("mouseout", function (e) { toolEnd(e); }, false);
    canvas.addEventListener("mousemove", function (e) { toolMove(e); }, false);
    
    canvas.addEventListener("touchstart", function (e) {
        toolStart(e.changedTouches[0]);
        e.preventDefault();
    }, false);
    canvas.addEventListener("touchmove", function (e) {
        toolMove(e.changedTouches[0]);
        e.preventDefault();
    }, false);
    canvas.addEventListener("touchend", function (e) {
        toolEnd(e.changedTouches[0]);
        e.preventDefault();
    }, false);
    
    var buttonHandlers = {
        "buttonDraw": function() {
            mouseMode = 1;
        },
        "buttonErase": function() {
            mouseMode = 2;
        },
        "buttonSprinkler": function() {
            mouseMode = 3;
        },
        "buttonSprinklerReset": function() {
            sprinklers = [];
            onSprinklersChange();
        },
        "buttonFreeze": function() {
            ctx.fillStyle = "rgb(128, 128, 255)";
            drops.forEach(function(drop) {
                ctx.fillRect (drop.x*screenScale, drop.y*screenScale, screenScale, screenScale);
            });
            ctx.fillStyle = "rgb(0, 0, 255)";
            drops = [];
        },
        "buttonUnderground": function buttonUnderground() {
            buttonUnderground.fill = !buttonUnderground.fill;
            var indexVal;
            ctx.fillStyle = "rgb(255, 00, 00)";
            if(buttonUnderground.fill) {
                drops = [];
                indexVal = 1;
            } else {
                ctx.fillStyle = "rgb(0, 00, 00)";
                indexVal = 0;
            }
            ctx.fillRect (0, 0, w*screenScale, h*screenScale);
            for(var y=0; y<h; y++) {
                for(var x=0; x<w; x++) {
                    hitIndex[y][x] = indexVal;
                }
            }
            ctx.fillStyle = "rgb(0, 0, 255)";
        },
        "buttonRectangle": function() {
            mouseModeStyle=2;
        },
        "buttonPencil": function() {
            mouseModeStyle=1;
        },
        "buttonPausePlay": function() {
            togglePlay();
        },
        "buttonRandomLine": function() {
            randomLine();
        }
    };

    Object.keys(buttonHandlers).forEach(function(key){
        (function(){
            var element = document.getElementById(key);
            if(element) {
                element.onclick = function() {
                    var selection = element.innerHTML;
                    var parentId = element.parentNode.id;
                    var selectionReceiver = null;
                    if(parentId === "chooseAction") {
                        selectionReceiver = "activeAction";
                    } else if (parentId === "chooseShape") {
                        selectionReceiver = "activeShape";
                    }
                    if(selectionReceiver !== null) {
                        document.getElementById(selectionReceiver).innerHTML = selection;
                    }
                    buttonHandlers[key]();
                };
            }
        })();
    });
    
    window.onresize = function() {
        //setupCanvas();
    };
})();