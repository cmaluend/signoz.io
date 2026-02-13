#!/bin/bash
SKIP_IF_ONLY_CHANGES_IN=(
  "data/comparisons"
  "data/opentelemetry"
  "data/case-study"
  "data/faqs"
  "data-assets"
  ".github/workflows"
  "scripts/vercel-ignore-build.sh"
  "scripts/sync-content-to-strapi.js"
  "scripts/update-pr-comment.js"
  ".gitignore"
)

set -e

# Returns 0 if $1 (file path) is under any of the restricted paths
is_in_restricted_path() {
  local file="$1"
  for prefix in "${SKIP_IF_ONLY_CHANGES_IN[@]}"; do
    if [[ "$file" == "$prefix"* ]] || [[ "$file" == "$prefix" ]]; then
      return 0
    fi
  done
  return 1
}

# Get list of changed files
get_changed_files() {
  if [[ "${1:-}" == "--local" ]] || [[ -z "$VERCEL_ENV" ]]; then
    # Local testing or --local flag: use last commit only
    git diff --name-only HEAD^ HEAD 2>/dev/null || true
  elif [[ "$VERCEL_ENV" == "production" ]]; then
    # Production: diff against previous commit on the branch
    git diff --name-only HEAD^ HEAD 2>/dev/null || true
  elif [[ -n "$VERCEL_GIT_PULL_REQUEST_ID" ]] && [[ -n "$VERCEL_GIT_REPO_OWNER" ]] && [[ -n "$VERCEL_GIT_REPO_SLUG" ]]; then
    # Preview (PR): fetch base branch and diff for full PR diff
    local base_ref base_sha
    local api_url="https://api.github.com/repos/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}/pulls/${VERCEL_GIT_PULL_REQUEST_ID}"
    local pr_json
    if [[ -n "$GITHUB_TOKEN" ]]; then
      pr_json=$(curl -s -f -H "Authorization: Bearer $GITHUB_TOKEN" "$api_url" 2>/dev/null) || true
    else
      pr_json=$(curl -s -f "$api_url" 2>/dev/null) || true
    fi

    if [[ -n "$pr_json" ]]; then
      IFS='|' read -r base_ref base_sha _ < <(echo "$pr_json" | python3 -c "
import sys,json
d=json.load(sys.stdin)
b=d.get('base',{})
print(b.get('ref','main')+'|'+b.get('sha',''))
" 2>/dev/null) || base_ref="main" base_sha=""

      if [[ -n "$base_ref" ]]; then
        git fetch origin "$base_ref" --depth=100 2>/dev/null || git fetch origin main --depth=100 2>/dev/null || true
        git diff --name-only "origin/$base_ref" HEAD 2>/dev/null || git diff --name-only "$base_sha" HEAD 2>/dev/null || true
      else
        git diff --name-only HEAD^ HEAD 2>/dev/null || true
      fi
    else
      # Fallback: use HEAD^ HEAD if API fails (e.g. rate limit, private repo without token)
      git diff --name-only HEAD^ HEAD 2>/dev/null || true
    fi
  else
    # Preview (branch push without PR): diff against previous commit
    git diff --name-only HEAD^ HEAD 2>/dev/null || true
  fi
}

changed=$(get_changed_files "$@")

# No changed files → skip build
if [[ -z "$changed" ]] || [[ -z "$(echo "$changed" | tr -d '[:space:]')" ]]; then
  echo "⏭️  No changed files detected. Skipping build."
  exit 0
fi

# Check if any changed file is outside restricted paths
outside_restricted=()
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if ! is_in_restricted_path "$file"; then
    outside_restricted+=("$file")
  fi
done <<< "$changed"

if [[ ${#outside_restricted[@]} -gt 0 ]]; then
  echo "✅ Build will proceed: changes detected outside restricted paths:"
  printf '   %s\n' "${outside_restricted[@]}"
  exit 1
fi

# All changed files are in restricted paths → skip build
echo "⏭️  All changed files are in restricted paths. Skipping build."
echo "   Changed: $(echo "$changed" | tr '\n' ' ')"
exit 0
