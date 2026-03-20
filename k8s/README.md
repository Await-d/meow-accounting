# Kubernetes 集群部署指南

本文档提供喵呜记账应用的 Kubernetes 集群部署完整指南。

## 前置条件

### 1. 集群要求
- Kubernetes 1.24+
- kubectl 已配置并连接到集群
- 至少 3 个工作节点
- 每个节点至少 2 CPU 和 4GB 内存

### 2. 必需组件
```bash
# Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Cert-Manager (用于自动管理SSL证书)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Metrics Server (用于HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Prometheus Operator (可选，用于监控)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

## 快速部署

### 1. 创建命名空间和基础资源
```bash
kubectl apply -f k8s/deployment.yaml
```

### 2. 配置密钥（重要！）
```bash
# 修改JWT密钥
kubectl create secret generic meow-accounting-secret \
  --from-literal=JWT_SECRET='your_strong_random_secret_here' \
  --from-literal=REDIS_PASSWORD='your_redis_password_here' \
  -n meow-accounting \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 3. 配置域名
编辑 `k8s/deployment.yaml` 中的 Ingress 配置，将 `meow-accounting.example.com` 替换为你的实际域名。

### 4. 部署监控（可选）
```bash
kubectl apply -f k8s/monitoring.yaml
```

### 5. 验证部署
```bash
# 检查所有资源状态
kubectl get all -n meow-accounting

# 检查Pod日志
kubectl logs -f deployment/meow-accounting -n meow-accounting

# 检查服务
kubectl get svc -n meow-accounting

# 检查Ingress
kubectl get ingress -n meow-accounting
```

## 详细配置

### 存储配置

默认使用 `standard` StorageClass。如果你的集群使用不同的StorageClass，需要修改：

```yaml
# 在 k8s/deployment.yaml 中修改
spec:
  storageClassName: your-storage-class  # 改为你的StorageClass
```

### 自动扩缩容

HPA配置已包含在部署文件中：
- 最小副本数：3
- 最大副本数：10
- CPU触发阈值：70%
- 内存触发阈值：80%

手动调整：
```bash
kubectl edit hpa meow-accounting-hpa -n meow-accounting
```

### SSL证书配置

使用Let's Encrypt自动签发证书：

```bash
# 创建ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### 数据库备份

#### 手动备份
```bash
# 进入Pod
kubectl exec -it deployment/meow-accounting -n meow-accounting -- /bin/sh

# 备份数据库
sqlite3 /app/data/sqlite.db ".backup /app/data/backup-$(date +%Y%m%d).db"

# 将备份复制到本地
kubectl cp meow-accounting/meow-accounting-xxx:/app/data/backup-20251108.db ./backup.db
```

#### 自动备份（使用CronJob）
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
  namespace: meow-accounting
spec:
  schedule: "0 2 * * *"  # 每天凌晨2点
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: await2719/meow-accounting:latest
              command:
                - /bin/sh
                - -c
                - |
                  sqlite3 /app/data/sqlite.db ".backup /app/data/backup-$(date +%Y%m%d).db"
                  # 这里可以添加上传到S3或其他存储的命令
              volumeMounts:
                - name: data
                  mountPath: /app/data
          restartPolicy: OnFailure
          volumes:
            - name: data
              persistentVolumeClaim:
                claimName: meow-accounting-data
```

## 监控和日志

### 查看日志
```bash
# 实时日志
kubectl logs -f deployment/meow-accounting -n meow-accounting

# 所有Pod的日志
kubectl logs -l app=meow-accounting -n meow-accounting --all-containers=true

# 查看最近100行
kubectl logs deployment/meow-accounting -n meow-accounting --tail=100
```

### Prometheus监控
访问Prometheus UI：
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```
然后访问 http://localhost:9090

### Grafana仪表板
访问Grafana：
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```
然后访问 http://localhost:3000
- 用户名：admin
- 密码：获取方式 `kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode`

## 扩展和维护

### 手动扩展
```bash
# 扩展到5个副本
kubectl scale deployment meow-accounting -n meow-accounting --replicas=5
```

### 滚动更新
```bash
# 更新镜像
kubectl set image deployment/meow-accounting meow-accounting=await2719/meow-accounting:v2.0.0 -n meow-accounting

# 查看更新状态
kubectl rollout status deployment/meow-accounting -n meow-accounting

# 回滚
kubectl rollout undo deployment/meow-accounting -n meow-accounting
```

### 资源调整
```bash
# 修改资源限制
kubectl edit deployment meow-accounting -n meow-accounting

# 或使用patch
kubectl patch deployment meow-accounting -n meow-accounting -p '{"spec":{"template":{"spec":{"containers":[{"name":"meow-accounting","resources":{"limits":{"memory":"2Gi","cpu":"2000m"}}}]}}}}'
```

## 故障排查

### Pod无法启动
```bash
# 查看Pod事件
kubectl describe pod -l app=meow-accounting -n meow-accounting

# 查看Pod日志
kubectl logs <pod-name> -n meow-accounting --previous
```

### 数据库连接问题
```bash
# 检查数据卷挂载
kubectl describe pvc meow-accounting-data -n meow-accounting

# 进入Pod检查数据库文件
kubectl exec -it deployment/meow-accounting -n meow-accounting -- ls -la /app/data
```

### Redis连接问题
```bash
# 检查Redis Pod状态
kubectl get pod -l app=redis -n meow-accounting

# 测试Redis连接
kubectl exec -it deployment/meow-accounting -n meow-accounting -- sh -c 'apk add redis && redis-cli -h redis-service -a $REDIS_PASSWORD ping'
```

### Ingress无法访问
```bash
# 检查Ingress状态
kubectl describe ingress meow-accounting-ingress -n meow-accounting

# 检查Ingress Controller日志
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# 检查证书状态
kubectl get certificate -n meow-accounting
kubectl describe certificate meow-accounting-tls -n meow-accounting
```

## 性能优化

### 1. 启用Pod亲和性
将Pod调度到不同节点以提高可用性：
```yaml
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - meow-accounting
            topologyKey: kubernetes.io/hostname
```

### 2. 使用节点亲和性
将Pod调度到高性能节点：
```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node-type
                operator: In
                values:
                  - high-performance
```

### 3. 配置资源请求和限制
根据实际负载调整：
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## 安全加固

### 1. 启用Pod Security Policy
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: meow-accounting-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### 2. 配置RBAC
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: meow-accounting-role
  namespace: meow-accounting
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
```

### 3. 网络策略
已包含在 `k8s/monitoring.yaml` 中，限制Pod间通信。

## 卸载

```bash
# 删除所有资源
kubectl delete namespace meow-accounting

# 删除PVC（如果需要）
kubectl delete pvc -n meow-accounting --all

# 删除监控资源
kubectl delete -f k8s/monitoring.yaml
```

## 参考资源

- [Kubernetes官方文档](https://kubernetes.io/docs/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Cert-Manager文档](https://cert-manager.io/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)
