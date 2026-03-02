// 矿石类型映射
export const type_map = {
    1: { name: '土', color: '#8B4513', price: 1 },
    2: { name: '石头', color: '#696969', price: 5 },
    3: { name: '铁', color: '#708090', price: 10 },
    4: { name: '黄金', color: '#FFD700', price: 30 },
    5: { name: '钻石', color: '#B9F2FF', price: 100 },
    6: { name: '红物质', color: '#E0115F', price: 500 },
    7: { name: '虚空水晶', color: '#9966CC', price: 1000 },
    8: { name: '黑洞碎片', color: '#2F4F4F', price: 10000 }
}

// 根据y坐标获取层级信息
export const getRange = (y) => {
    const ranges = [
        { min: 9000, max: 10000, label: '9000-10000', leave: 9, rate: [0,0,0,0,0,0,0.4,0.3,0.3] },
        { min: 7000, max: 9000, label: '7000-9000', leave: 8, rate: [0,0,0.3,0.2,0.2,0.1,0.1,0.1] },
        { min: 5000, max: 7000, label: '5000-7000', leave: 7, rate: [0,0.2,0.2,0.2,0.2,0.1,0.1] },
        { min: 2000, max: 5000, label: '2000-5000', leave: 6, rate: [0.2,0.2,0.2,0.2,0.2] },
        { min: 500, max: 2000, label: '500-2000', leave: 5, rate: [0.3,0.3,0.2,0.1,0.1] },
        { min: 50, max: 500, label: '50-500', leave: 4, rate: [0.4,0.3,0.2,0.1] },
        { min: 10, max: 50, label: '10-50', leave: 3, rate: [0.6,0.3,0.1] },
        { min: 1, max: 10, label: '1-10', leave: 2, rate: [0.9,0.1] }
    ];
    
    for (const range of ranges) {
        if (y >= range.min && y <= range.max) {
            return range;
        }
    }
    return { min: 0, max: 0, label: '未知', leave: 1, rate: [1] };
}

// 创建等级分布
export const createLevelDistribution = (totalCount, maxLevel, probabilities, remainingLevel = 1) => {
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
        if (level === remainingLevel) continue;
        
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

// 生成随机矿石类型
export const generateOreType = (y) => {
    const range = getRange(y);
    if (!range || !range.rate) return 1; // 默认返回土
    
    // 根据概率随机选择矿石等级
    const random = Math.random();
    let cumulative = 0;
    
    for (let level = 1; level <= range.leave; level++) {
        const probability = range.rate[level - 1] || 0;
        cumulative += probability;
        if (random < cumulative) {
            return level;
        }
    }
    
    return 1; // 默认返回土
}

// 初始化世界地图的矿石
export const initializeWorldOres = (width, height, worldBounds) => {
    const ores = {};
    
    // 遍历世界中的所有格子
    for (let x = worldBounds.left; x < worldBounds.right; x++) {
        for (let y = worldBounds.top; y < worldBounds.bottom; y++) {
            const key = `${x},${y}`;
            const oreLevel = generateOreType(y);
            ores[key] = {
                type: oreLevel,
                name: type_map[oreLevel].name,
                color: type_map[oreLevel].color,
                price: type_map[oreLevel].price
            };
        }
    }
    
    return ores;
}

// 扩展世界时生成新的矿石
export const extendWorldOres = (ores, worldBounds, oldBounds) => {
    const newOres = { ...ores };
    
    // 生成新扩展区域的矿石
    for (let x = worldBounds.left; x < worldBounds.right; x++) {
        for (let y = worldBounds.top; y < worldBounds.bottom; y++) {
            const key = `${x},${y}`;
            
            // 如果这个格子还没有矿石，生成新的
            if (!newOres[key]) {
                const oreLevel = generateOreType(y);
                newOres[key] = {
                    type: oreLevel,
                    name: type_map[oreLevel].name,
                    color: type_map[oreLevel].color,
                    price: type_map[oreLevel].price
                };
            }
        }
    }
    
    return newOres;
}