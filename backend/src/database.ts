/*
 * @Author: Await
 * @Date: 2025-03-15 18:10:15
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 18:10:15
 * @Description: 数据库模块导出
 */

// 从config目录下的database.ts重新导出
export { DB, db, DatabaseError } from './config/database';

// 默认导出db实例
import { db } from './config/database';
export default db; 