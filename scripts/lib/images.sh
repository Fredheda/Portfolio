ACR=acrchatbotfredheda
RG=rg-chatbot

# "<acr repository>|<container app>|<dockerfile>|<build context>", in rollout order.
IMAGES=(
  "portfolio-backend|ca-portfolio-backend|backend/Dockerfile|backend"
  "portfolio-web|ca-portfolio-web|frontend/Dockerfile|frontend"
)

is_sha() {
  [[ "$1" =~ ^[0-9a-f]{40}$ ]]
}

image_exists() {
  az acr repository show -n "$ACR" --image "$1:$2" -o none >/dev/null 2>&1
}

lock_tag() {
  az acr repository update -n "$ACR" --image "$1:$2" \
    --delete-enabled false --write-enabled true --output none
}

unlock_tag() {
  az acr repository update -n "$ACR" --image "$1:$2" \
    --delete-enabled true --write-enabled true --output none
}
