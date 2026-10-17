# ONGIT · 온기잇 웹사이트

검정 배경과 오렌지 포인트의 반응형 브랜드 홈페이지 + 관리자 상품 관리 도구입니다.

## 기능
- 반응형 브랜드 메인 / 상품 목록 / 브랜드 소개
- 관리자 비밀번호 로그인, 상품 사진 업로드 (5MB 제한)
- 상품명, 가격, 상세설명, 쿠팡 링크 등록/수정/삭제
- 공개/비공개, ↑ ↓ 순서 변경
- SQLite 데이터베이스 영구 저장(서버 디스크), 업로드 이미지 서버 디스크 저장

## 로컬에서 실행
Node.js 20 이상이 필요합니다.

```bash
npm install
# macOS/Linux
export ADMIN_PASSWORD='여기에_12자_이상의_안전한_비밀번호'
export SESSION_SECRET='여기에_16자_이상의_랜덤_시크릿'
npm start
```

Windows PowerShell:

```powershell
npm install
$env:ADMIN_PASSWORD="여기에_12자_이상의_안전한_비밀번호"
$env:SESSION_SECRET="여기에_16자_이상의_랜덤_시크릿"
npm start
```

- 쇼핑몰: http://localhost:3000
- 관리자: http://localhost:3000/admin.html
- 최초 등록 상품은 없습니다. 관리자로 로그인해 실제 상품을 등록하세요.

## 공개 배포 시 주의
- Node.js 서버 호스팅이 필요합니다. 정적 HTML만 업로드하면 상품관리 API는 작동하지 않습니다.
- `ADMIN_PASSWORD`, `SESSION_SECRET`을 호스팅 환경변수로 등록하고 `NODE_ENV=production`으로 설정하세요.
- HTTPS 도메인으로 배포하세요. 프록시 뒤에 있는 경우 `TRUST_PROXY=1`을 사용하세요.
- `storage/`와 `public/uploads/`의 **지속 볼륨 및 백업**이 필요합니다. 일회성 서버에 올리면 상품과 이미지가 사라집니다.
- 쿠팡 상품 링크는 HTTPS `coupang.com` 하위 도메인만 허용합니다. 파트너스 링크 등 다른 도메인은 별도 검토가 필요합니다.
- 현재 세션 저장소는 서버 메모리입니다. 여러 서버 인스턴스 또는 고가용성 운영에는 Redis 등 세션 저장소와 CSRF 보호 등 추가 보안 조치를 권장합니다.
- 사진 업로드는 파일 확장자/헤더 검증을 포함하지만 공용 서비스 장기 운영 시 이미지 재인코딩과 악성코드 스캔을 추가하는 것이 좋습니다.
- 도메인·서버 계약과 실제 배포는 아직 하지 않았습니다.

## 브랜드 소개 섹션

홈페이지의 `OUR STORY` 섹션에 슬로건 「당신의 일상에 온기를」, 브랜드 철학, 상품 선정 기준 3가지를 추가했습니다. 문구는 `public/index.html`, 스타일은 `public/style.css`에서 수정할 수 있습니다.


## Render 배포 (지속 저장 지원 버전)
1. GitHub 새 저장소 생성 후 `ongit-site` 폴더 **안의 파일들**을 저장소 최상위에 업로드합니다. `.env` 등 비밀번호 파일을 업로드하지 마세요.
2. Render New > Web Service > GitHub 저장소 연결. Build Command: `npm install`, Start Command: `npm start`, Runtime: Node.
3. Environment 설정: `ADMIN_PASSWORD` (12자 이상), `SESSION_SECRET` (16자 이상 긴 랜덤 문자열), `NODE_ENV=production`, `TRUST_PROXY=1`, `DATA_DIR=/var/data`.
4. **유료 Web Service + Persistent Disk**가 필요합니다. Disk Mount Path: `/var/data` (DB 및 업로드 사진 보존). 무료 임시 디스크는 재시작시 데이터가 삭제될 수 있습니다.
5. 배포 후 `https://서비스명.onrender.com` 및 `/admin.html` 에 접속해 테스트합니다.
6. Render Settings > Custom Domains 에 도메인을 넣고, 구매처 DNS 레코드를 Render 안내대로 설정합니다.

주의: Render 과금 정책은 가입 및 설정 시 화면에서 확인하세요. 사진·상품 데이터 백업 및 관리자 계정 보안은 운영자의 책임입니다.
