import request from '@/utils/request';

// 登录
export const login = (params) => 
    request({
        url: '/api/sysAuth/login',
        method: 'post',
        data: params,
    });

// 系统信息
export const sysInfo = (params) => 
    request({
        url: '/api/sysConfig/sysInfo',
        method: 'get',
        params,
    });

// 刷新token  拿 refreshToken 去获取新的 accessToken
export const getToken = (params) => 
    request({
        url: `/api/sysAuth/refreshToken`,
        method: 'get',
        data: params,
    });



