var PaintBook = {};

///////////////////////////////////////////////////////////////////////
//  Global
///////////////////////////////////////////////////////////////////////
PaintBook.Global = {
  'wrapper': "drawing",
  'menu1': 'tools--second',
  'menu2': 'tools--first',
  'colors': ["red", "orange", "yellow", "green", "blue", 'white'],
  'currentColor': 'red',
  'paintType': 'bucket',
  'clickEventType': { 
    'start':(document.ontouchstart === null && typeof (document.ontouchstart) === "object") || typeof(document.ontouchstart)=='undefined' ? 'mousedown':'touchstart',
    'move':(document.ontouchstart === null && typeof (document.ontouchstart) === "object") || typeof(document.ontouchstart)=='undefined' ? 'mousemove':'touchmove',
    'up':(document.ontouchstart === null && typeof (document.ontouchstart) === "object") || typeof(document.ontouchstart)=='undefined' ? 'mouseup':'touchend',
  },
  'getScreenSize': function() {
		return { 
			'w': $(window).width(),
			'h': $(window).height()
		};
	},
};
///////////////////////////////////////////////////////////////////////
//  Class
///////////////////////////////////////////////////////////////////////
/* 
 * Simple JavaScript Inheritance
 */
(function(){
  // The base Class implementation (does nothing)
  PaintBook.Class = function(){};
 
  // Create a new Class that inherits from this class
  PaintBook.Class.extend = function(prop, extend){
	var superObj = {}, prototypeObj = {};
	var superPrototype = extend ? extend.prototype : {};
	
	var returnClass = function(){
		if(this._super._setSub){
			this._super._setSub(this);
		}
		if(this.init){
			this.init.apply(this, arguments);
		}
	}
	
	for(var name in prop){
		prototypeObj[name] = prop[name];
	}
	
	for(var name in superPrototype){
		if(prototypeObj[name] == undefined){
			prototypeObj[name] = superPrototype[name];
		}
		superObj[name] = superPrototype[name];
	}
	
	prototypeObj._super = superObj;
	
	//add a function for recursive setting of sub instance 
	prototypeObj._setSub = function(sub){
		this._sub = sub;
		if(this._super._setSub){
			this._super._setSub(sub._super);
		}
	}
	
	returnClass.constructor = returnClass;
	returnClass.prototype = prototypeObj;
	
	//add a static extend to the current class  
	returnClass.extend = function(prop){
		return PaintBook.Class.extend.call(this, prop, returnClass);
	}
	
	return returnClass;
};
})();

///////////////////////////////////////////////////////////////////////
//  Menuhandler
///////////////////////////////////////////////////////////////////////
/*
 * Renders and handles menu area
 */
PaintBook.MenuHandler = PaintBook.Class.extend({
  init: function(){
	this.go = PaintBook.Global;
    this.attachEvents();
    this.drawColors();
    
  },
  drawColors: function() {
    var showColorsCount = this.go.colors.length;
    var toolsColorsUl = this.go.menu1El.find('ul.colors');
    var _this = this;
    var activeClass;
    for(var i=0; i < showColorsCount; i++) {
        activeClass = this.go.currentColor == this.go.colors[i] ? "active" : "";
		toolsColorsUl.append('<li><a style="background-color:'+this.go.colors[i]+'" class="'+ activeClass +'"></a></li>').find('li:last-child a').bind(this.go.clickEventType.up, function() { _this.colorHandler.apply(_this, [this]); });
	}
  },
  attachEvents: function(){
    var _this = this;
    
    this.go.menu2El.find('.btn--bucket').bind(this.go.clickEventType.up, 
        function() { _this.bucketHandler.apply(_this, [this]); });
    
    this.go.menu2El.find('.btn--pen').bind(this.go.clickEventType.up, 
        function() { _this.penHandler.apply(_this, [this]); });
    
  },
  bucketHandler: function(target) {
	var el = $(target);
	this.go.paintType = 'bucket';
	this.go.menu2El.find('.active').removeClass('active');
	el.addClass('active');	
    this.triggerMenuClickEvent(el, {'type':'bucket'});
    return false;
  },
  penHandler: function(target) {
	var el = $(target);
	this.go.paintType = 'pen';
	this.go.menu2El.find('.active').removeClass('active');
	el.addClass('active');
    this.triggerMenuClickEvent(el, {'type':'pen'});
    return false;
  },
  colorHandler: function(target){
	var el = $(target);
	PaintBook.Global.currentColor = el.css('background-color');
	this.toggleActive(el);	
  },
  toggleActive: function(el){
	this.go.menu1El.find('.active').removeClass('active');
	el.addClass('active');
  },
  triggerMenuClickEvent: function(el, data) {
    el.trigger('paintBook.menuClick',data);
  }
});

///////////////////////////////////////////////////////////////////////
//  Painthandler
///////////////////////////////////////////////////////////////////////
/*
 * Renders and handles paint area
 */
PaintBook.PaintHandler = PaintBook.Class.extend ({
  init: function(){
	this.go = PaintBook.Global;
    this.draw = SVG(this.go.wrapper);
    this.draw.node.setAttribute('viewBox', '0 0 ' + 300 + ' ' + 350);
    this.draw.node.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    
    this.penData = {
      strokeWidth: 2,
      boundingClientRect: this.draw.node.getBoundingClientRect(),
      bufferSize: 8,
      path: null,
      strPath: null,
      buffer: []
    };
    // bind: scope to this and create a new function
    this.penHandlerStart = this.penHandlerStart.bind(this); 
    this.penHandlerMove = this.penHandlerMove.bind(this); 
    this.penHandlerUp = this.penHandlerUp.bind(this); 
       
    //draw a background
    this.draw.rect(300, 350).fill({ color: '#fff' });
    var url = new URL(window.location.href);
    var svgId = url.searchParams.get("id");
    var _this = this;
    var onSuccess = function(data) {
      _this.draw.svg(data);
      
      _this.draw.each(function(i, children) {
        // click event on all but black lines
        if(this.attr('fill')!="#000000") {
          this.click(function(){ _this.fillHandler.apply(_this, [this]) });
        }
      }, true);
    }
    
    $.ajax({
		url: 'img/'+svgId+'.svg',
		data: "",
		success: onSuccess,
		dataType: "text"
	});
    
  },
  fillHandler: function(target) {
    if(this.go.paintType == 'bucket') {
      target.fill({ color: this.go.currentColor }); 
    }
  },
  penHandlerInit: function(data) {
    
    // todo: reorder svg paths so pen paths are above filled paths and below lines (unfilled paths)
    
    // stop pen
    if(this.go.paintType != 'pen') {
      this.draw.node.removeEventListener(this.go.clickEventType.start,this.penHandlerStart);
      this.draw.node.removeEventListener(this.go.clickEventType.move,this.penHandlerMove);
      this.draw.node.removeEventListener(this.go.clickEventType.up,this.penHandlerUp);
    }
    // start pen
    else if(this.go.paintType == 'pen') {
      this.draw.node.addEventListener(this.go.clickEventType.start, this.penHandlerStart);
      this.draw.node.addEventListener(this.go.clickEventType.move, this.penHandlerMove);
      this.draw.node.addEventListener(this.go.clickEventType.up, this.penHandlerUp);
    }
  },
  penHandlerStart: function(e) {
    // https://stackoverflow.com/questions/40324313/svg-smooth-freehand-drawing
    this.penData.boundingClientRect = this.draw.node.getBoundingClientRect();
    this.penData.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.penData.path.setAttribute("fill", "none");
    this.penData.path.setAttribute("stroke", this.go.currentColor);
    this.penData.path.setAttribute("stroke-width", this.penData.strokeWidth);
    this.penData.buffer = [];
    var pt = this.getMousePosition(e);
    this.penHandlerAppendToBuffer(pt);
    this.penData.strPath = "M" + pt.x + " " + pt.y;
    this.penData.path.setAttribute("d", this.penData.strPath);
    this.draw.node.appendChild(this.penData.path);
  },
  penHandlerMove: function(e) {
    if (this.penData.path) {
        this.penHandlerAppendToBuffer(this.getMousePosition(e));
        this.penHandlerUpdateSvgPath();
    }
  },
  penHandlerUp: function(e) {
    if (this.penData.path) {
      var p = SVG.adopt(this.penData.path);
      p.click(function(){ _this.fillHandler.apply(_this, [this]) });
      this.penData.path = null;
    }
  },
  getMousePosition: function (e) {
    return {
        x: (e.pageX - this.penData.boundingClientRect.left) * 300/this.penData.boundingClientRect.width,
        y: (e.pageY - this.penData.boundingClientRect.top) * 350/this.penData.boundingClientRect.height
    }
  },
  penHandlerAppendToBuffer: function (pt) {
    this.penData.buffer.push(pt);
    while (this.penData.buffer.length > this.penData.bufferSize) {
        this.penData.buffer.shift();
    }
  },
  penHandlerGetAveragePoint: function (offset) {
    var len = this.penData.buffer.length;
    if (len % 2 === 1 || len >= this.penData.bufferSize) {
        var totalX = 0;
        var totalY = 0;
        var pt, i;
        var count = 0;
        for (i = offset; i < len; i++) {
            count++;
            pt = this.penData.buffer[i];
            totalX += pt.x;
            totalY += pt.y;
        }
        return {
            x: totalX / count,
            y: totalY / count
        }
    }
    return null;
  },
  penHandlerUpdateSvgPath: function () {
    var pt = this.penHandlerGetAveragePoint(0);

    if (pt) {
        // Get the smoothed part of the path that will not change
        this.penData.strPath += " L" + pt.x + " " + pt.y;

        // Get the last part of the path (close to the current mouse position)
        // This part will change if the mouse moves again
        var tmpPath = "";
        for (var offset = 2; offset < this.penData.buffer.length; offset += 2) {
            pt = this.penHandlerGetAveragePoint(offset);
            tmpPath += " L" + pt.x + " " + pt.y;
        }

        // Set the complete current path coordinates
        this.penData.path.setAttribute("d", this.penData.strPath + tmpPath);
    }
  }
});

PaintBook.app = function() {
  var go = PaintBook.Global;
  go.menu1El = $('.'+go.menu1).first();
  go.menu2El = $('.'+go.menu2).first();
  
  var paint = new PaintBook.PaintHandler();
  var menu = new PaintBook.MenuHandler();
  
  go.menu2El.bind('paintBook.menuClick',
    function(event,data) {
      switch(data.type) {
        case 'pen':
        case 'bucket':
          paint.penHandlerInit(data);
          break;
      }
    }
  );
}

PaintBook.app();




