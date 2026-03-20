Common dev commands:
- Frontend: `cd frontend && pnpm install`, `pnpm run dev`, `pnpm run build`, `pnpm start`, `pnpm run lint`
- Backend: `cd backend && pnpm install`, `pnpm run dev`, `pnpm run build`, `pnpm start`, `pnpm test`
- Docker: `./build-docker.sh` (guided), or `docker-compose build --build-arg NEXT_PUBLIC_API_URL=/api` then `docker-compose up -d`, `docker-compose logs -f`, `docker-compose down`
- API testing: `curl -X GET http://localhost:3001/api/transactions -H "Authorization: Bearer <token>"`
- DB init: `node dist/models/init-db.js`
