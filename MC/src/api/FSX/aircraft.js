import request from '@/utils/request';
console.log(request,'request')
// 编辑机组
export const UpdateAircraft = (params) => 
    request({
        url: '/api/unit/unit',
        method: 'post',
        data: params,
    });

// 分页查询机组
export const PageAircraft = (params) => 
    request({
        url: '/api/unit/unit',
        method: 'post',
        data: params,
    });




