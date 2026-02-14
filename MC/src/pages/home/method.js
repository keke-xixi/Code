// 矿石
const type_map = {
    1: { name: '土', color: '#8B4513', price: 1 },
    2: { name: '石头', color: '#696969', price: 5 },
    3: { name: '铁', color: '#708090', price: 10 },
    4: { name: '黄金', color: '#FFD700', price: 30 },
    5: { name: '钻石', color: '#B9F2FF', price: 100 },
	6: { name: '红物质', color: '#E0115F', price: 500 },
	7: { name: '虚空水晶', color: '#9966CC', price: 1000 },
	8: { name: '黑洞碎片', color: '#2F4F4F', price: 10000 }
}
/*
   根据y获取每个层级的信息
*/
export const getRange = (y)=> {
    const ranges = [
		/*
		  min、max 表示范围  leave 表示最大等级多少 rate 表示矿石等级出现的概率
		*/
        { min: 9000, max: 10000, label: '9000-10000',leave: 9, rate: [0,0,0,0,0,0,0.4,0.3,0.3] },
        { min: 7000, max: 9000, label: '7000-9000', leave: 8, rate: [0,0,0.3,0.2,0.2,0.1,0.1,0.1]  },
        { min: 5000, max: 7000, label: '5000-7000', leave: 7, rate: [0,0.2,0.2,0.2,0.2,0.1,0.1] },
        { min: 2000, max: 5000, label: '2000-5000' , leave: 6, rate: [0.2,0.2,0.2,0.2,0.2]},
        { min: 500, max: 2000, label: '500-2000', leave: 5, rate: [0.3,0.3,0.2,0.1,0.1] },
        { min: 50, max: 500, label: '100-500', leave: 4, rate: [0.4,0.3,0.2,0.1]  },
        { min: 10, max: 50, label: '1-100', leave: 3, rate: [0.6,0.3,0.1] },
		{ min: 1, max: 10, label: '1-10', leave: 2, rate: [0.9,0.1] }
    ];
    
    for (const range of ranges) {
        if (y >= range.min && y <= range.max) {
            return range;
        }
    }
    
    return '超出范围';
}

/*
  // 使用示例
  10 是总数量  7 是总等级 最后的1 剩余数量给等级1
  const probabilities = [0.1, 0, 0, 0, 0, 0, 0.9];  // 0.1是等级1的概率，0.9是等级7的概率
  const distribution = createLevelDistribution(10, 7, probabilities, 1);
  console.log('等级分布:', distribution);
  distribution.forEach(item => {
      console.log(`等级 ${item.level}: 概率 ${item.probability.toFixed(2)}%, 数量 ${item.count}`);
  });
  
  console.log('验证总和:', distribution.reduce((sum, item) => sum + item.count, 0));
*/
export const createLevelDistribution = (totalCount, maxLevel, probabilities, remainingLevel = 1) => {
    // 参数验证
    if (!Array.isArray(probabilities) || probabilities.length !== maxLevel) {
        throw new Error('概率数组长度必须等于最大等级');
    }
    
    const sumProb = probabilities.reduce((sum, prob) => sum + prob, 0);
    if (Math.abs(sumProb - 1) > 0.0001) {
        throw new Error('概率总和必须为100%');
    }
    
    if (totalCount <= 0) {
        throw new Error('总数量必须大于0');
    }
    
    if (remainingLevel < 1 || remainingLevel > maxLevel) {
        throw new Error('剩余数量分配等级必须在有效范围内');
    }
    
    const distribution = new Array(maxLevel);
    let remainingCount = totalCount;
    
    // 先分配除了剩余等级之外的所有等级
    for (let level = maxLevel; level >= 1; level--) {
        if (level === remainingLevel) continue; // 跳过剩余等级
        
        const probability = probabilities[level - 1];
        const calculatedCount = Math.floor(totalCount * probability);
        const actualCount = Math.min(calculatedCount, remainingCount);
        
        distribution[level - 1] = {
            level: level,
            probability: probability * 100,
            count: actualCount
        };
        
        remainingCount -= actualCount;
    }
    
    // 最后分配剩余等级
    distribution[remainingLevel - 1] = {
        level: remainingLevel,
        probability: probabilities[remainingLevel - 1] * 100,
        count: remainingCount
    };
    
    return distribution;
}
