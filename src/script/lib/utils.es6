// PIXI 的扩展
PIXI.DisplayObject.prototype.set = function(arg) {
	for(let key in arg) {
		this[key] = arg[key]; 
	}
}

// scale 属性拍平
Object.defineProperties(PIXI.DisplayObject.prototype, {
	scaleX: {
		set: function(value) {
			this.scale.x = value; 
		}, 
		get: function() {
			return this.scale.x; 
		}
	}, 
	scaleY: {
		set: function(value) {
			this.scale.y = value; 
		}, 
		get: function() {
			return this.scale.y; 
		}
	}, 
	pivotX: {
		set: function(value) {
			this.pivot.x = value; 
		}, 
		get: function() {
			return this.pivot.x; 
		}
	}, 
	pivotY: {
		set: function(value) {
			this.pivot.y = value
		}, 
		get: function() {
			return this.pivot.y; 
		}
	}, 
	anchorX: {
		set: function(value) {
			this.anchor.x = value; 
		}, 
		get: function() {
			return this.anchor.x; 
		}
	}, 
	anchorY: {
		set: function(value) {
			this.anchor.y = value
		}, 
		get: function() {
			return this.anchor.y; 
		}
	}
}); 

// 获取不带描边的boudary
{
    let dirty = Symbol("dirty"); 
    let getContentBox = function() {
        if(this[dirty] == this.dirty) return ; 
        this[dirty] = this.dirty; // 表示已经更新
        let cp = this.clone(); 
        let graphicsData = cp.graphicsData; 
        for(let graphics of graphicsData) {
            graphics.lineWidth = 0; 
        } 
        this._cwidth = cp.width; 
        this._cheight = cp.height; 
    }
    Object.defineProperties(PIXI.Graphics.prototype, {
        "_cwidth": {writable: true, value: 0}, 
        "_cheight": {writable: true, value: 0}, 
        "cwidth": {
            get: function() {
                getContentBox.call(this); 
                return this._cwidth; 
            }
        }, 
        "cheight": {
            get: function() {
                getContentBox.call(this); 
                return this._cheight; 
            }
        }
    }); 
}