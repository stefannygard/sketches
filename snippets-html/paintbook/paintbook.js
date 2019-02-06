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
    'up':(document.ontouchstart === null && typeof (document.ontouchstart) === "object") || typeof(document.ontouchstart)=='undefined' ? 'mousedown':'touchend',
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
      strpath: null,
      buffer: []
    };
    // bind scopes to this and creates a new function
    this.penHandlerStart = this.penHandlerStart.bind(this); 
       
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
    // stop pen
    if(this.go.paintType != 'pen') {
       this.draw.node.removeEventListener(this.go.clickEventType.start,this.penHandlerStart);
    }
    // start pen
    else if(this.go.paintType == 'pen') {
      this.draw.node.addEventListener(this.go.clickEventType.start, this.penHandlerStart);
    }
  },
  penHandlerStart: function(e) {
    // https://stackoverflow.com/questions/40324313/svg-smooth-freehand-drawing
    console.log("starting", this);
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




