// 快速波动均分算法
export default function waveaverage(n = 5, crest = 4, trough = 4, isInteger = true) { 
	// 平均结果
	let list = []; 
	// 无法进行波动均分，直接返回完全平分
	if(crest > (n - 1) * trough || trough > (n - 1) * crest) {
		return new Array(n).fill(0); 
	}
	// 最少需要消除的高度
	let base = 0; 
	// 波动量
	let wave = 0; 
	// 高位
	let high = crest; 
	// 低位
	let low = -trough; 
	// 累计量 
	let sum = 0; 
	// 剩余数量 
	let count = n; 

	while(--count >= 0) {
		// 获取当前的波动量
		if(crest > count * trough - sum) {
			high = count * trough - sum; 
		}
		if(trough > count * crest + sum) {
			low = -sum - count * crest; 
		}
		base = low; 
		wave = high - low; 
		// 随机波动量 
		let rnd; 
		if(count > 0) {
			// 随机波动
			rnd = base + Math.random() * (wave + 1); 
		}
		else {
			rnd = -sum; 
		}
		if(isInteger === true) {
			rnd = Math.floor(rnd); 
		} 
		sum += rnd; 
		list.push(rnd); 
	}
	return list; 
}