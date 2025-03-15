/*
 * @Author: Await
 * @Date: 2025-03-14 20:24:51
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 11:30:18
 * @Description: 请填写简介
 */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 生成预定义的粒子位置数组
const generateParticles = (count: number) => {
    return Array.from({ length: count }, () => ({
        top: 10 + Math.random() * 80,
        left: Math.random() * 100,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2
    }));
};

const DashboardBackground: React.FC = () => {
    // 确保不在初始渲染时有客户端/服务器不匹配
    const [particles, setParticles] = useState<Array<{ top: number, left: number, duration: number, delay: number }>>([]);
    const [isMounted, setIsMounted] = useState(false);

    // 在客户端组件挂载后生成粒子
    useEffect(() => {
        // 仅在客户端运行
        setParticles(generateParticles(10));
        setIsMounted(true);
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* 顶部渐变 */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent" />

            {/* 左上角装饰 */}
            <div className="absolute top-0 left-0">
                <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-10">
                    <circle cx="100" cy="100" r="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                </svg>
            </div>

            {/* 右上角装饰 - 仅客户端渲染 */}
            {isMounted && (
                <motion.div
                    className="absolute top-16 right-16 w-32 h-32 border border-primary/10 rounded-full"
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}

            {/* 浮动粒子 - 仅在客户端渲染后显示 */}
            {isMounted && particles.map((particle, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
                    style={{
                        top: `${particle.top}%`,
                        left: `${particle.left}%`,
                    }}
                    animate={{
                        y: [0, -10, 0],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: particle.delay
                    }}
                />
            ))}

            {/* 网格线 */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(125,125,125,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(125,125,125,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>
    );
};

export default DashboardBackground; 