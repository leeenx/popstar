/*
    author: leeenx
    @ timer 对象
    @ 提供 7 个API如下：
    @ timer.setTimeout(fun, delay[, id])
    @ timer.clearTimeout(id)
    @ timer.setInterval(fun, delay[, id])
    @ timer.clearInterval(id)
    @ timer.delete(id) 删除对应id的timeout/interval
    @ timer.pause(id) 暂停对应id的timeout/interval
    @ timer.resume(id) 恢复对应id的timeout/interval
    @ timer.clean() 清空所有 timeout & interval
*/

class Timer {
    // 构造函数 
    constructor() { 
        // 暂停状态 - 这是个公共状态，由外部 Ticker 决定。
        this.paused = true; 

        // 队列
        this.queue = new Map(); 

        // 正在使用 timer 的 RAF
        this.usingRAF = false; 

        // useRAF 触发器
        Reflect.defineProperty(this, "useRAF", {
            set: function(value) {
                Reflect.set(this, "usingRAF", value); 
                value ? Timer.RAF.enable() : Timer.RAF.disable(); 
            }
        }); 
    }

    // setTimeout 的实现
    setTimeout(fn, delay, id = Symbol("timeoutID")) { 
        // 存入队列 
        this.queue.set(id, {
            fn: fn, 
            type: 0, 
            paused: 0, 
            elapsed: 0, 
            delay: delay
        }); 
        return id; 
    }

    // clearTimeout
    clearTimeout(id) {
        return this.delete(id); 
    }

    // setInterval 的实现
    setInterval(fn, delay, id = Symbol("intervalID")) {
        // 存入队列
        this.queue.set(id, {
            fn: fn, 
            type: 1, 
            paused: 0, 
            elapsed: 0, 
            delay: delay
        }); 
        return id; 
    }

    // clearInterval
    clearInterval(id) {
        return this.delete(id); 
    }

    // 修改指定id的 delay/fn
    set(id, config = {}) { 
        let item = this.queue.get(id) || {}; 
        for(let key in config) {
            item[key] = config[key]; 
        }
	return true; 
    }

    // 删除 queue 上的成员
    delete(id) {
        return this.queue.delete(id); 
    }

    // 暂停指定id
    pause(id) {
        id === undefined ? this.pauseAll() : (this.queue.get(id).paused = 1); 
	return true; 
    }

    // 恢复指定id
    resume(id) {
        return this.play(id); 
    } 
    
    // 播放指定id
    play(id) {
        id === undefined ? this.playAll() : (this.queue.get(id).paused = 0); 
	return true; 
    } 

    // 清空timer
    clean() {
        this.queue = new Map(); 
	return true; 
    }

    // 暂停全部 id
    pauseAll() {
        this.queue.forEach((item) => item.paused = 1); 
	return true; 
    }

    // 播放全部 id
    playAll() {
        this.queue.forEach((item) => item.paused = 0); 
	return true;
    }

    // tick
    tick(delta) { 
        this.paused || this.updateQueue(delta); 
    }

    // 更新 map 队列
    updateQueue(delta) { 
        this.queue.forEach((item, id) => {
            if(item.paused === 1) return; 
            item.elapsed += delta; 
            if(item.elapsed >= item.delay) {
                item.fn(); 
                item.type === 0 ? this.delete(id) : (item.elapsed = 0); 
            } 
        }); 
    }

    // 状态更新
    update() { 
        // 第一次调用 update 时主动停用原生接口
        this.useRAF = false; 

        // 下面是真正的 update
        this.update = (delta) => {
        	if(this.usingRAF) return; 
	        this.tick(delta); 
        } 
    }

}

class AnimationFrame { 
    constructor() {
        this.time = 0; 
        this.auto = this.auto.bind(this); 
    }
    auto(elapsed) { 
        timer.tick(elapsed - this.time); 
        this.time = elapsed; 
        this.id = requestAnimationFrame(this.auto); 
    }
    enable() { 
        timer.paused = false; 
        this.id = requestAnimationFrame(this.auto); 
    }
    disable() {
        cancelAnimationFrame(this.id); 
    }
}

// 原生RAF
Timer.RAF = new AnimationFrame(); 

// 对外接口
let timer = new Timer(); 

// 默认使用原生 RAF
timer.useRAF = true; 
// 导出timer
export default timer; 