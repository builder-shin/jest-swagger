#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 결과 추적 변수
FAILED_STEPS=()
TOTAL_STEPS=4
PASSED_STEPS=0

# 로그 파일 임시 저장소
TEMP_LOG=$(mktemp)

# 함수: 단계 실행 및 결과 표시
run_step() {
    local step_name=$1
    local step_command=$2
    local step_number=$3

    echo -e "\n${YELLOW}[$step_number/$TOTAL_STEPS] $step_name 실행 중...${NC}"

    # 명령어 실행 및 출력 캡처
    if eval "$step_command" > "$TEMP_LOG" 2>&1; then
        echo -e "${GREEN}✅ $step_name 성공${NC}"
        PASSED_STEPS=$((PASSED_STEPS + 1))
        return 0
    else
        echo -e "${RED}❌ $step_name 실패${NC}"
        FAILED_STEPS+=("$step_name")
        echo -e "\n${RED}=== 상세 로그 ===${NC}"
        cat "$TEMP_LOG"
        echo -e "${RED}=================${NC}\n"
        return 1
    fi
}

# 헤더 출력
echo "========================================="
echo "   프로젝트 검증 스크립트"
echo "========================================="
echo ""

# 1. TypeScript 타입 체크
run_step "TypeScript 타입 체크" "npm run typecheck" 1

# 2. ESLint 검사
run_step "ESLint 검사" "npm run lint" 2

# 3. Prettier 포맷 체크
run_step "Prettier 포맷 체크" "npm run format:check" 3

# 4. Jest 테스트
run_step "Jest 테스트" "npm test -- --passWithNoTests" 4

# 임시 파일 정리
rm -f "$TEMP_LOG"

# 최종 결과 요약
echo ""
echo "========================================="
echo "   검증 결과 요약"
echo "========================================="
echo -e "통과: ${GREEN}$PASSED_STEPS${NC} / $TOTAL_STEPS"

if [ ${#FAILED_STEPS[@]} -eq 0 ]; then
    echo -e "\n${GREEN}🎉 모든 검증이 성공적으로 완료되었습니다!${NC}"
    exit 0
else
    echo -e "\n${RED}실패한 단계:${NC}"
    for step in "${FAILED_STEPS[@]}"; do
        echo -e "  ${RED}• $step${NC}"
    done
    echo ""
    exit 1
fi
