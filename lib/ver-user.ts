import axios, { AxiosRequestConfig } from 'axios'
import { LoginRequest, UserInfo } from './types'

const API_BASE_URL = 'https://139.196.124.53:3000'  // 或者使用相对路径 '/api'

const apiClient = axios.create({
    baseURL: "https://139.196.124.53:3000/api",
    headers: {
        'Content-Type': 'application/json'
    }
})

export async function getRequest<T>(url: string, data: T, config?: AxiosRequestConfig): Promise<T> {
    try {
        const response = await apiClient.request<T>({
            method: 'post',
            url: url,
            headers: { 
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            ...config
        });
        return response.data;
    } catch (error) {
        console.error('GET Error:', error);
        throw error;
    }
}

export async function postRequest<T>(url: string, data: T, config?: AxiosRequestConfig): Promise<T> {
    try{
        const response = await apiClient.post<T>(url, data, config)
        return response.data
    } catch (error) {
        console.error('POST Error:', error)
        throw error
    }
}

export function login (username: string, password: string) {
    return new Promise(async (resolve, reject) => {
        try{
            const response = await postRequest('/login', {username, password})
            resolve(response)
        }catch (error){
            reject(error)
        }
    })
}

export function getCookie(name: string) {
    // 确保代码运行在客户端
    if (typeof window === 'undefined') {
        return '';
    }

    const cookies = document.cookie.split(';');
    
    // 遍历所有 cookie
    for (let cookie of cookies) {
        // 去除cookie字符串两端的空格
        cookie = cookie.trim();
        
        // 检查这个cookie是否以我们要找的名字开头
        if (cookie.startsWith(name + '=')) {
            // 返回cookie的值部分（去掉名字和等号）
            return cookie.substring(name.length + 1);
        }
    }
    
    // 如果没找到对应的cookie，返回空字符串
    return '';
}

export function deleteCookie(name: string) {
    // 遍历所有 cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        // 去除cookie字符串两端的空格
        cookie = cookie.trim();
        
        // 检查这个cookie是否以我们要删除的名字开头
        if (cookie.startsWith(name + '=')) {
            // 设置cookie的过期时间为过去，以删除该cookie
            document.cookie = `123; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    }
}



const verTokenClient = axios.create({
    baseURL: "https://139.196.124.53:3000/api",
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie('MeetProUsertoken') ? getCookie('MeetProUsertoken') : ''}`
    }
})

async function verTokenPostRequest<T>(url: string, data: T, config?: AxiosRequestConfig): Promise<T> {
    try{
        const response = await verTokenClient.post<T>(url, data, config)
        return response.data
    } catch (error) {
        console.error('POST Error:', error)
        throw error
    }
}

export function verToken () {
    return new Promise(async (resolve, reject) => {
        try{
            const response = await verTokenPostRequest('/validate-token', {})
            resolve(response)
        }catch (error){
            reject(error)
        }
    })
}

export function getUserInfo() {
    return new Promise(async (resolve, reject) => {
        try{
            const response = await verTokenPostRequest('/user/info', {})
            resolve(response)
        }catch (error){
            reject(error)
        }
    })
}