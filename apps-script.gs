/**
 * 멀미 타이머 — Google Sheets 백엔드 (Google Apps Script)
 *
 * 역할
 *  - doGet():  시트의 탭(피험자) 목록과 A열(시나리오) 목록을 JSON으로 반환.
 *             앱이 피험자·시나리오 드롭다운을 채울 때 호출한다.
 *  - doPost(): 앱이 보낸 멀미 점수를 "피험자 탭 → 시나리오 행 → 분(min) 열" 위치에 기록한다.
 *             31분 이후처럼 헤더가 없는 열은 분(min) 숫자를 자동으로 채워 넣는다.
 *
 * 배포
 *  1) 기록용 Google Sheets에서 확장 프로그램 → Apps Script 열기
 *  2) 이 코드를 붙여넣기
 *  3) 배포 → 새 배포 → 웹 앱 / 실행: 나 / 액세스: 모든 사용자
 *  4) 나온 웹 앱 URL(.../exec)을 앱 설정 화면의 "구글 시트 자동 기록" 칸에 입력
 *  코드 수정 후에는 배포 → 배포 관리 → 수정 → "새 버전" 으로 재배포하면 URL이 유지된다.
 *
 * 시트 양식 (탭 1개 = 피험자 1명)
 *  A1  분(min) | B1..AE1  1..30          <- 헤더 행
 *  A2  SLC 오전 | B2..AE2  (점수가 기록됨)  <- 시나리오 행
 *  A3  분(min) | ...                       (시나리오마다 헤더 행이 위에 반복)
 *  A4  S&G 오전 | ...
 *  ...
 */

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var subjects = ss.getSheets().map(function (s) { return s.getName(); });

  var scenarios = [];
  var names = ss.getSheets()[0].getRange('A1:A200').getValues();
  for (var i = 0; i < names.length; i++) {
    var v = String(names[i][0]).trim();
    if (v && v.indexOf('분(min)') < 0 && v !== '미분류' && scenarios.indexOf(v) < 0) {
      scenarios.push(v);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ subjects: subjects, scenarios: scenarios }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = (d.subject && ss.getSheetByName(String(d.subject).trim())) || ss.getSheets()[0];

    // 연결 테스트
    if (d.test) {
      sheet.getRange('AG1').setValue('연결 OK: ' + new Date());
      return ContentService.createTextOutput('ok');
    }

    var m = Math.round(Number(d.minute));
    if (isFinite(m) && m >= 1 && d.scenario) {
      var names = sheet.getRange('A1:A200').getValues();
      for (var i = 0; i < names.length; i++) {
        if (String(names[i][0]).trim() == String(d.scenario).trim()) {
          var row = i + 1;   // 시나리오 행
          var col = m + 1;   // 분 열 (1분 = B열 = 2)
          sheet.getRange(row, col).setValue(d.score);

          // 헤더(분 숫자)가 비어 있으면 자동으로 채움 — 시나리오 바로 윗줄의 분(min) 행
          if (row > 1) {
            var headerA = String(sheet.getRange(row - 1, 1).getValue());
            var headerCell = sheet.getRange(row - 1, col);
            if (headerA.indexOf('분(min)') >= 0 && headerCell.getValue() === '') {
              headerCell.setValue(m);
            }
          }
          return ContentService.createTextOutput('ok');
        }
      }
    }

    // 시나리오를 못 찾았거나 분 값이 이상하면 버리지 말고 맨 아래에 보관
    sheet.appendRow(['미분류', d.scenario || '', d.minute || '', d.elapsed || '',
                     (d.score == null ? '' : d.score), String(d.ts || '')]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}
