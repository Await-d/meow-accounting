import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface BackgroundEffectProps {
    variant?: 'default' | 'minimal';
}

const BackgroundEffect: React.FC<BackgroundEffectProps> = ({ variant = 'default' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 设置canvas大小为窗口大小
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        // 粒子属性
        const particlesArray: Particle[] = [];
        const numberOfParticles = variant === 'minimal' ? 50 : 100;

        // 创建粒子类
        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = `hsla(${Math.random() * 60 + 200}, 70%, 60%, ${Math.random() * 0.8 + 0.2})`;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                else if (this.x < 0) this.x = canvas.width;

                if (this.y > canvas.height) this.y = 0;
                else if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 初始化粒子
        const initParticles = () => {
            for (let i = 0; i < numberOfParticles; i++) {
                particlesArray.push(new Particle());
            }
        };

        // 连接粒子
        const connectParticles = () => {
            if (!ctx) return;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    const dx = particlesArray[a].x - particlesArray[b].x;
                    const dy = particlesArray[a].y - particlesArray[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        const opacity = 1 - distance / 150;
                        ctx.strokeStyle = `rgba(150, 150, 255, ${opacity * 0.15})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        // 动画循环
        const animate = () => {
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制几何装饰
            if (variant === 'default') {
                drawDecorations();
            }

            // 更新和绘制粒子
            for (const particle of particlesArray) {
                particle.update();
                particle.draw();
            }

            // 连接粒子
            connectParticles();

            requestAnimationFrame(animate);
        };

        // 绘制几何装饰
        const drawDecorations = () => {
            if (!ctx) return;

            // 左上角装饰
            ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
            ctx.beginPath();
            ctx.lineWidth = 1.5;
            ctx.arc(0, 0, 200, 0, 0.5 * Math.PI);
            ctx.stroke();

            // 右下角装饰
            ctx.beginPath();
            ctx.arc(canvas.width, canvas.height, 250, Math.PI, 1.5 * Math.PI);
            ctx.stroke();

            // 中心装饰
            ctx.beginPath();
            ctx.lineWidth = 0.8;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const size = Math.min(canvas.width, canvas.height) * 0.4;
            ctx.moveTo(centerX - size / 2, centerY - size / 2);
            ctx.lineTo(centerX + size / 2, centerY - size / 2);
            ctx.lineTo(centerX + size / 2, centerY + size / 2);
            ctx.lineTo(centerX - size / 2, centerY + size / 2);
            ctx.lineTo(centerX - size / 2, centerY - size / 2);
            ctx.stroke();
        };

        // 初始化和运行
        initParticles();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [variant]);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* 渐变光晕效果 */}
            <div className="absolute top-0 -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] -z-10" />
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[150px] -z-10" />

            {/* 几何形状装饰 */}
            <motion.div
                className="absolute top-[20%] right-[10%] w-16 h-16 border border-primary/20 rounded-full"
                animate={{
                    y: [0, 15, 0],
                    opacity: [0.6, 0.9, 0.6],
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute top-[10%] left-[20%] w-24 h-24 border border-secondary/30 rounded-xl rotate-45"
                animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.6, 0.3],
                    rotate: [45, 35, 45]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-[30%] left-[5%] w-20 h-20 bg-gradient-to-tr from-primary/5 to-secondary/5 rounded-lg"
                animate={{
                    x: [0, 10, 0],
                    opacity: [0.4, 0.7, 0.4],
                    rotate: [0, 10, 0]
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
};

export default BackgroundEffect; 