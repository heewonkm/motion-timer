# 멀미 타이머 (Motion Sickness Timer)

실차 멀미 실험을 위한 iPad용 웹앱(PWA). 피험자가 태블릿으로 책(PDF)을 읽는 동안, 설정한 간격마다 **소리 없이 은은한 초록 불빛**으로 멀미 정도를 기록할 시점을 알리고, 0~10 점수를 눌러 **Google Sheets에 실시간 자동 기록**한다. 실험 전·중·후 설문(SurveyMonkey)도 앱 안에서 진행한다.

**▶ 실행: https://heewonkm.github.io/motion-timer/**

> 순수 프론트엔드(HTML/CSS/JS 단일 파일) + Google Apps Script 백엔드로 구성. 별도 서버 없이 GitHub Pages로 배포하며, 서비스 워커로 오프라인에서도 동작한다.

---

## 왜 이렇게 만들었나 (설계 배경)

- **iPad는 다른 앱 위에 오버레이를 띄울 수 없다** → PDF 뷰어를 앱 밖에 두는 대신, **앱 안에서 PDF를 직접 렌더링**하고 그 위에 알림 불빛·점수 패널을 겹쳤다.
- **실험 장소에 인터넷이 없을 수 있다** → 서비스 워커로 앱 자체를 캐싱해 **오프라인 PWA**로 만들었다. (단, 구글/설문 등 외부 요청은 캐싱하지 않고 항상 실시간)
- **피험자가 알림 시점을 예측하면 안 된다** → 책 읽기 모드에서는 카운트다운 숫자를 숨긴다.
- **실험 중 오조작 방지** → 종료·뒤로가기는 "꾹 누르기", 점수는 "선택 후 OK" 2단계.

---

## 주요 기능

- **자유로운 타이머** — 전체 측정 시간·알림 간격·불빛 지속 시간을 자유 설정
- **소리 없는 불빛 알림** — 화면 가장자리에서 은은하게 맥박치는 초록 불빛 (텍스트 없음)
- **앱 내 PDF 뷰어** — 책을 앱 안에서 열어 전체 화면으로 읽기 (pdf.js, 보이는 페이지만 렌더링)
- **0~10 멀미 점수 입력** — 알림과 함께 점수 패널이 뜨고, 선택 후 OK로 확정
- **Google Sheets 자동 기록** — 피험자 탭 × 시나리오 행 × 분(min) 열 위치에 실시간 기록, 오프라인 시 큐잉 후 자동 재전송
- **설문 내장** — SurveyMonkey 설문 6종을 실험 전/중/후 단계로 앱 안에서 진행, 완료 체크
- **오조작 방지** — 종료/뒤로가기는 길게 누르기, 화면 자동 꺼짐 방지(Wake Lock)
- **오프라인 지원 & 자동 업데이트** — 홈 화면 추가 시 앱처럼 실행, 새 버전 자동 반영

---

## 기술 스택

| 구분 | 내용 |
|---|---|
| 프론트엔드 | 순수 HTML/CSS/JavaScript (프레임워크 없음, 단일 `index.html`) |
| PDF 렌더링 | [pdf.js](https://mozilla.github.io/pdf.js/) v3.11 (오프라인 번들) |
| 오프라인 | Service Worker (`sw.js`) + Web App Manifest |
| 저장 | IndexedDB(책 파일) · localStorage(설정/전송 큐) |
| 백엔드 | Google Apps Script (`apps-script.gs`) → Google Sheets |
| 배포 | GitHub Pages (정적 호스팅) |
| 기타 API | Screen Wake Lock, Clipboard |

---

## 파일 구조

```
motion-timer/
├── index.html            앱 전체 (UI + 로직, 단일 파일)
├── sw.js                 서비스 워커 (오프라인 캐싱)
├── manifest.webmanifest  PWA 매니페스트
├── apps-script.gs        Google Sheets 백엔드 코드 (배포용)
├── pdf.min.js            pdf.js 라이브러리
├── pdf.worker.min.js     pdf.js 워커
├── icon-180.png          앱 아이콘 (홈 화면)
└── icon-512.png          앱 아이콘
```

---

## 직접 설치·운영하기

### 1. 앱 배포 (GitHub Pages)
1. 이 저장소를 Fork 또는 clone
2. 저장소 Settings → Pages → Branch를 `main` / `/(root)`로 설정
3. `https://<사용자명>.github.io/motion-timer/` 로 접속

### 2. Google Sheets 연동
1. 기록용 Google Sheets 준비 (탭 1개 = 피험자 1명, 행 = 시나리오, 열 = 분)
2. 확장 프로그램 → Apps Script → [`apps-script.gs`](apps-script.gs) 내용 붙여넣기
3. 배포 → 새 배포 → **웹 앱** / 실행: 나 / 액세스: **모든 사용자**
4. 나온 웹 앱 URL을 앱 설정 화면의 "구글 시트 자동 기록" 칸에 입력 → 🔗 연결 테스트

### 3. iPad에서 사용
1. Safari로 앱 주소 열기 → 공유 → **홈 화면에 추가**
2. (인터넷 연결 상태에서) 한 번 실행하면 오프라인 캐시 저장 완료
3. 설정 화면에서 책 PDF·피험자·시나리오·설문을 준비하고 실험 시작

---

## 실험 흐름

```
피험자 도착
  → 앱에서 피험자·시나리오 선택, 책 PDF 열기
  → (실험 전 설문: 컨디션 / MSSQ / MSAQ 주행 전)
  → 책 읽기 시작 → 1분마다 초록 불빛 + 0~10 점수 입력 → 시트 자동 기록
  → (실험 중 설문: MSAQ 주행 중 — 원하는 시점에)
  → 측정 종료
  → (실험 후 설문: MSAQ 주행 후 / FSS 몰입도)
```

---

## 개발

프레임워크·빌드 과정이 없어 `index.html`을 브라우저로 열면 바로 실행된다. 로컬 확인 시:

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

---

made by heewonkm@kookmin.ac.kr
