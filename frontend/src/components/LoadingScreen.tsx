"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components';

// 为粒子定义类型
interface Particle {
    id: number;
    top: string;
    left: string;
    duration: number;
    delay: number;
    xOffset: number;
}

const LoadingScreen: React.FC = () => {
    // 使用state来存储粒子位置，初始为空数组
    const [particles, setParticles] = useState<Particle[]>([]);
    // 跟踪组件是否已挂载到客户端
    const [isMounted, setIsMounted] = useState(false);

    // 组件挂载检查
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 使用useEffect确保只在客户端生成粒子
    useEffect(() => {
        if (!isMounted) return;

        // 生成6个随机位置的粒子
        const newParticles = Array.from({ length: 6 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 2,
            xOffset: Math.random() * 10 - 5 // 预先计算x方向的随机移动值
        }));

        setParticles(newParticles);
    }, [isMounted]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="relative flex flex-col items-center">
                {/* Logo动画 */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <Logo variant="large" />
                </motion.div>

                {/* 加载指示器 */}
                <div className="relative w-64 h-2 bg-default-100 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: '0%' }}
                        animate={{
                            width: ['0%', '30%', '50%', '70%', '100%'],
                        }}
                        transition={{
                            duration: 1.5,
                            ease: "easeInOut",
                            times: [0, 0.2, 0.5, 0.8, 1],
                            repeat: Infinity
                        }}
                    />
                </div>

                {/* 加载文字 */}
                <motion.p
                    className="mt-4 text-default-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    载入应用中，请稍候...
                </motion.p>

                {/* 背景装饰元素 */}
                <div className="absolute -z-10">
                    <motion.div
                        className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-secondary/5 blur-3xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }}
                    />
                </div>

                {/* 粒子装饰 - 仅客户端渲染 */}
                <div className="absolute -z-10 inset-0">
                    {isMounted && particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="absolute w-2 h-2 rounded-full bg-primary/30"
                            style={{
                                top: particle.top,
                                left: particle.left,
                            }}
                            animate={{
                                y: [0, -20, 0],
                                x: [0, particle.xOffset, 0],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                delay: particle.delay,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen; 