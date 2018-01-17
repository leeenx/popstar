/*
	@ author: leeenx
	@ 模式
*/

import shuffle from '../lib/shuffle.es6'; 
import waveaverage from '../lib/waveaverage.es6'; 

export default class Model {
	constructor() { 
		// 行列数 - 固定
		this.row = this.col = 10; 
		/* 
			@ 墙体信息 - 因为砖块是向下沉的 
			@ count - 列砖块数
			@ start - 顶部行索引
			@ end - 底部行索引(好像没什么意思，因为它是个固定值)
			@ pitCount - 坑数
			@ topPit - 最顶部的坑
			@ bottomPit - 最底部的坑
			@ 如果 pitCount > 0 && bottomPit - topPit + 1 === pitCount 表示坑位是连续的 
		*/
		this.wall = new Array(this.col); 
		for(let i = 0; i < this.col; ++i) {
			this.wall[i] = {
				count: this.row, 
				start: 0, 
				end: this.row - 1, 
				pitCount: 0, 
				topPit: this.row, 
				bottomPit: -1 
			}
		}

		// 需要更新的列 - 记录哪几个列被消除了砖块
		this.updatedColSet = new Set(); 

		// 表格总数 10x10
		this.gridCellCount = 100; 

		// 星星的表格
		this.grid = []; 

		// 砖块
		this.tiles = new Array(this.gridCellCount); 
		for(let i = 0; i < this.gridCellCount; ++i) {
			this.tiles[i] = { 
				// 原始索引 ---- 永远不变（相当于id）
				originIndex: undefined, 
				// 实时索引 ---- 反映在 grid 的位置
				index: undefined, 
				// 颜色索引
				clr: 0, 
				// 分值
				score: 0, 
				// 是否移除 
				removed: false
			}; 
		}

		// 可见色砖总数
		this.tileCount = this.gridCellCount; 
	}
	// 填充数组 ---- count 表示几种颜色
	init() { 
		// 色砖小计数
		let subtotal = 0; 
		// 波动均分色块
		waveaverage(5, 4, 4).forEach(
			(count, clr) => { 
				count += 20; 
				// 色砖数量 
				while(0 < count--) {
					let tile = this.tiles[subtotal++]; 
					// 删除 originIndex ---- 提前删除可以提升性能
					delete tile.originIndex; 
					tile.clr = clr; 
				}
			}
		);

		// 打散 tiles
		shuffle(this.tiles); 

		// 存入 grid
		this.grid = this.tiles.map(
			(tile, index) => { 
				// 实时索引
				tile.index = index; 
				// 原索引
				tile.originIndex = index; 
				// 默认在舞台上 
				tile.removed = false; 
				return tile; 
			}
		); 

		// 可见色砖总数重置 
		this.tileCount = this.gridCellCount; 

		// 生成新的列信息
		for(let i = 0; i < this.col; ++i) {
			this.wall[i] = {
				count: this.row, 
				start: 0, 
				end: this.row - 1, 
				pitCount: 0, 
				topPit: this.row, 
				bottomPit: -1 
			}
		}

		// 死局 ---- 重新生成关卡
		if(this.check() === false) {
			this.init(); 
		}
	}
	// 上节点颜色对比
	compareTopTile(index, rowIndex, colIndex, clr) { 
		// 上节点索引
		let topIndex = index - this.col; 
		// 上边界「行」索引
		let topBoundary = this.wall[colIndex].start; 
		// 在最顶部
		if(rowIndex === topBoundary) return false; 
		// 非最顶部
		else if(this.grid[topIndex] !== undefined && this.grid[topIndex].clr === clr) {
			return topIndex; 
		}
		// 颜色不匹配
		else {
			return false; 
		}
	}
	// 右节点颜色对比
	compareRightTile(index, rowIndex, colIndex, clr) { 
		// 右节点索引
		let rightIndex = index + 1; 
		// 右边界「列」索引 
		let rightBoundary = this.wall.length - 1; 
		// 在最右部
		if(colIndex === rightBoundary) return false; 
		// 非最右部
		else if(this.grid[rightIndex] !== undefined && this.grid[rightIndex].clr === clr) {
			return rightIndex; 
		}
		// 颜色不匹配
		else {
			return false; 
		}
	}
	// 下节点颜色对比
	compareBottomTile(index, rowIndex, colIndex, clr) { 
		// 下节点索引
		let bottomIndex = index + this.col; 
		// 下边界「行」索引
		let bottomBoundary = this.wall[colIndex].end; 
		// 在最底部
		if(rowIndex === bottomBoundary) return false; 
		// 非最底部
		else if(this.grid[bottomIndex] !== undefined && this.grid[bottomIndex].clr === clr) {
			return bottomIndex; 
		}
		// 颜色不匹配
		else {
			return false; 
		}
	}
	// 左节点颜色对比
	compareLeftTile(index, rowIndex, colIndex, clr) { 
		// 左节点索引
		let leftIndex = index - 1; 
		// 右边界「列」索引
		let leftBoundary = 0; 
		// 在最左部
		if(colIndex === leftBoundary) return false; 
		// 非最左部
		else if(this.grid[leftIndex] !== undefined && this.grid[leftIndex].clr === clr) {
			return leftIndex; 
		}
		// 颜色不匹配
		else {
			return false; 
		}
	}
	// 检查是否存在相邻的同色砖块
	hasNeighbour(index, rowIndex, colIndex) {
		let tile = this.grid[index]; 
		if(tile === undefined) return false; 
		let clr = tile.clr; 
		if(this.compareTopTile(index, rowIndex, colIndex, clr) !== false) return true;
		else if(this.compareRightTile(index, rowIndex, colIndex, clr) !== false) return true; 
		else if(this.compareBottomTile(index, rowIndex, colIndex, clr) !== false) return true; 
		else if(this.compareLeftTile(index, rowIndex, colIndex, clr) !== false) return true; 
		else return false; 
	}
	// 寻找相邻同色砖块
	searchSameClr(index, rowIndex, colIndex, clr) { 
		let sameClrTiles = [
			this.compareTopTile(index, rowIndex, colIndex, clr), 
			this.compareRightTile(index, rowIndex, colIndex, clr), 
			this.compareBottomTile(index, rowIndex, colIndex, clr), 
			this.compareLeftTile(index, rowIndex, colIndex, clr)
		]; 
		return sameClrTiles.filter(index => index !== false); 
	}
	// 删除指字的单元格
	deleteCell(index, rowIndex, colIndex, count) { 
		let tile = this.grid[index]; 
		// 表示已经被删除过了
		if(tile === undefined) return false; 
		// 标记分值
		tile.score = count * 10 + 5; 
		// 标记被移去
		tile.removed = true; 
		// 从 grid 上删除 
		delete this.grid[index]; 
		// 更新colInfo
		this.updateColInfo(index, rowIndex, colIndex); 
		return true; 
	}
	// 清除指定索引的色块及其相邻的同色块
	clean(index) {
		// 当前的行列坐标 - 纯粹是为了提高一点性能
		let colIndex = index % this.col, rowIndex = index / this.col >> 0;
		// 周边没有相同颜色砖块，直接中断
		if(this.hasNeighbour(index, rowIndex, colIndex) === false) return 0; 
		// 周边有相同颜色砖块
		else { 
			// 当前砖块
			let tile = this.grid[index], clr = tile.clr; 

			// 同色砖块
			let sameClrTiles = this.searchSameClr(index, rowIndex, colIndex, clr); 

			// 被删除的个数
			let count = 0; 

			// 删除砖块
			this.deleteCell(index, rowIndex, colIndex, count) && ++count; 

			while(true) { 
				// 下一次循环的 sameClrTiles 数组
				let nextSameClrTiles = []; 
				sameClrTiles.forEach(index => { 
					// 当前的行列坐标 - 纯粹是为了提高一点性能
					let colIndex = index % this.col, rowIndex = index / this.col >> 0;
					nextSameClrTiles.push(...this.searchSameClr(index, rowIndex, colIndex, clr)); 
					this.deleteCell(index, rowIndex, colIndex, count) && ++count; 
				}); 
				// 下一次的同色砖块数量为0，表示清除结束
				if(nextSameClrTiles.length === 0) break; 
				// 数组替换
				sameClrTiles = nextSameClrTiles; 
			} 
			// 夯实数组
			// this.tamp(); 
			return count; 
		}
	}
	// 清空所有的色砖
	cleanAll() { 
		// 减分倍数
		let count = 0; 
		for(let col = 0, len = this.wall.length;  col < len; ++col) { 
			let colInfo = this.wall[col]; 
			for(let row = colInfo.start; row <= colInfo.end; ++row) {
				let tile = this.grid[row * this.col + col]; 
				tile.score = -20 - 40 * count++; 
				tile.removed = true; 
			}
		}
	}
	// 更新列信息
	updateColInfo(index, rowIndex, colIndex) { 
		this.updatedColSet.has(colIndex) || this.updatedColSet.add(colIndex); 
		let colInfo = this.wall[colIndex]; 
		// 当前列砖块数量减1
		--colInfo.count;
		// 列的空洞数加1
		++colInfo.pitCount; 
		// 更新顶坑位置
		colInfo.topPit = Math.min(colInfo.topPit, rowIndex); 
		// 更新底坑位置
		colInfo.bottomPit = Math.max(colInfo.bottomPit, rowIndex); 
		// 可见砖块总数更新
		--this.tileCount; 
	}
	// 夯实数组
	tamp() { 
		// 空列数 
		let emptyCol = []; 
		// 空列的最小与最大索引
		let min = this.col, max = -1;
		for(let colIndex of this.updatedColSet) { 
			let colInfo = this.wall[colIndex]; 
			let {start, end, pitCount, topPit, bottomPit, count} = colInfo; 

			// 垂直方法压缩 
			if(pitCount > 0) {
				// 连续空洞
				if(bottomPit - topPit + 1 === pitCount) { 
					// topPit 上面有砖块(如果上面没有砖块就已经是压缩状态)
					if(topPit > start) { 
						// 起始索引，其实是顶坑索引的正上方
						let fromIndex = (topPit - 1) * this.col + colIndex; 
						// 目标索引
						let toIndex = start * this.col + colIndex; 
						// 底坑索引 - 在夯实过程中会变
						let bottomPitIndex = bottomPit * this.col + colIndex; 
						for(let i = fromIndex; i >= toIndex; i -= this.col, bottomPitIndex -= this.col) { 
							// 执行压缩
							let tile = this.grid[bottomPitIndex] = this.grid[i]; 
							delete this.grid[i]; 
							// 更新自身索引
							tile.index = bottomPitIndex; 
						}
					}
				} 
				// 非连续空洞
				else { 
					// 底坑索引 - 在夯实过程中会变
					let bottomPitIndex = bottomPit * this.col + colIndex; 
					// 起始索引 - 底坑索引的正上方	
					let fromIndex = bottomPitIndex - this.col; 
					// 目标索引 
					let toIndex = start * this.col + colIndex; 
					for(let i = fromIndex; i >= toIndex; i -= this.col) {
						let tile = this.grid[i]; 
						// 当前位置有砖块，执行压缩
						if(tile !== undefined) {
							// 执行压缩
							this.grid[bottomPitIndex] = tile; 
							delete this.grid[i]; 
							// 更新自身索引
							tile.index = bottomPitIndex; 
							// 底坑索引上升
							bottomPitIndex -= this.col
						}
					}
				}
			}

			// 更新当前列的顶部行索引
			colInfo.start += pitCount; 
			// 当前列不存在色砖
			if(colInfo.count === 0) { 
				// 空列数
				emptyCol.push(colIndex); 
				// 动态记录最大最小索引
				max = Math.max(colIndex, max); 
				min = Math.min(colIndex, min); 
			}
			// 当前列仍有色砖
			else {
				// 重置坑洞信息
				colInfo.pitCount = 0; 
				colInfo.topPit = colInfo.count; 
				colInfo.bottomPit = -1; 
			}
		}
		// 空列总数
		let emptyColCount = emptyCol.length; 
		// 当前列数
		let colCount = this.wall.length; 
		// 有空列，水平方向压缩 
		if(emptyColCount > 0) { 
			// 连续的空列
			if(emptyColCount === 1 || max - min + 1 === emptyColCount) { 
				// 空列不处在最右边 - 空列在最右边表示已经是压缩状态，删除最右边的空列信息
				if(max !== colCount - 1) {
					for(let i = max + 1; i < colCount; ++i) {
						let colInfo = this.wall[i]; 
						let {start, end} = colInfo; 
						// 压缩
						for(let j = start; j <= end; ++j) { 
							// 压缩前索引
							let indexA = j * this.col + i; 
							// 压缩后索引 -- 其实就是往左移动 emptyColCoount 行
							let indexB = indexA - emptyColCount; 
							// 招行压缩
							let tile = this.grid[indexB] = this.grid[indexA]; 
							delete this.grid[indexA]; 
							// 更新索引
							tile.index = indexB; 
						}
						// wall 信息更新
						this.wall[i - emptyColCount] = colInfo; 
						delete this.wall[i]; 
					}
				} 
			}
			// 非连续的空列
			else { 
				// 最左边的空列 - 压缩过程会变化
				let leftEmptyColIndex = min; 
				for(let i = min + 1; i < colCount; ++i) {
					let colInfo = this.wall[i]; 
					let {start, end, count} = colInfo; 
					// 当前列到最左边空列的距离
					let distance = i - leftEmptyColIndex; 
					// 非空行 - 压缩
					if(count > 0) {
						for(let j = start; j <= end; ++j) {
							// 压缩前索引
							let indexA = j * this.col + i; 
							// 压缩后的索引 -- 其实就是移动到最左边的空列
							let indexB = indexA - distance; 
							// 招行压缩
							let tile = this.grid[indexB] = this.grid[indexA]; 
							delete this.grid[indexA]; 
							// 更新索引
							tile.index = indexB; 
						}

						// wall 信息更新
						this.wall[leftEmptyColIndex] = colInfo; 
						delete this.wall[i]; 

						// 最左边的空理右移一列
						++leftEmptyColIndex; 
					}
				}
			}

			// 删除最右边的空列
			this.wall.splice(colCount - emptyColCount, emptyColCount); 

		}

		// 清空 updatedColSet
		this.updatedColSet.clear(); 

	}
	/*
		@ 检查是否死局
		@ 非死局会返回一个索引值
		@ 死局返回 false
	*/
	check() { 
		if(this.tileCount === 0) return false;
		// 取一个随机「列」样本
		let patternCol = Math.random() * this.wall.length >> 0; 
		let {start, end} = this.wall[patternCol]; 
		// 取一个随机「行」样式
		let patternRow = Math.random() * (end - start + 1) + start >> 0; 

		// 向左扫描「列」
		for(let col = patternCol; col >=0; --col) { 
			let colInfo = this.wall[col]; 
			// 行索引 
			let rowIndex = (patternCol === col ? patternRow : colInfo.start); 
			// 向下扫描「行」
			for(let row = rowIndex; row <= colInfo.end; ++row) {
				let index = row * this.col + col; 
				// 有同色砖块，直接中断
				if(this.hasNeighbour(index, row, col)) {
					return index; 
				}
			}
		}
		// 向右扫描「列」
		for(let col = patternCol, len = this.wall.length; col < len; ++col) {
			let colInfo = this.wall[col]; 
			// 行索引 
			let rowIndex = (patternCol === col ? patternRow - 1 : colInfo.end); 
			// 向上扫描「行」
			for(let row = rowIndex; row >= colInfo.start; --row) {
				let index = row * this.col + col; 
				// 有同色砖块，直接中断
				if(this.hasNeighbour(index, row, col)) {
					return index; 
				}
			}
		}
		return false; 
	} 
}

