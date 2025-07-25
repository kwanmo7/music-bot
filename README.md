# Discord Music Bot

Discord에서 음성 채널에 접속해 YouTube 영상(링크 또는 검색어)으로 음악을 재생하는 뮤직 봇입니다.  
`yt-dlp.exe`를 이용해 최적의 오디오 스트림 URL을 추출하며, `discord.js`와 `@discordjs/voice`를 활용해 음성 재생을 처리합니다.

---

## 버전 정보

- 작성일: 2025-06-22
- 현재 상태: 테스트용 MVP (최소 기능 구현)

---

## 알려진 버그 및 이슈

- 🎵 **노래 재생 도중 재생이 끊기는 현상 발생**
  - 간헐적으로 `yt-dlp`에서 스트림 URL을 받아왔음에도 재생이 중간에 멈추는 문제가 있음
  - `AudioPlayerStatus.Idle`이 예상보다 빠르게 호출되는 경우 확인 필요
  - 원인: 유튜브 영상 도중 광고로 인해 재생이 멈춤

> ⏳ `play-dl`로 변경 중 , 수정 및 테스트 중

---

## 주요 기능

- `!play <유튜브 링크 또는 검색어>` 명령어로 음악 재생 요청  
- 검색어 입력 시 `play-dl`로 YouTube에서 자동 검색 후 재생  
- 여러 곡 재생 요청 시 대기열 관리  
- 음악 재생 완료 후 자동으로 다음 곡 재생  
- 오류 발생 시 자동으로 다음 곡 재생 시도  

---

## 요구 사항

- Node.js (v16 이상 권장)  
- `yt-dlp.exe` (프로젝트 루트 또는 실행 파일 위치에 배치)  
- Discord 봇 토큰 (환경변수 `DISCORD_TOKEN`에 설정)  
- 인터넷 연결 및 유튜브 접속 가능 환경  

---

## 설치 및 실행 방법

1. 저장소 클론 또는 소스 코드 다운로드

2. 의존성 설치

```bash
npm install discord.js @discordjs/voice play-dl dotenv
```

3. `yt-dlp.exe` 를 프로젝트 폴더(또는 코드에서 참조하는 경로)에 위치
4. 프로젝트 루트에 `.env` 팡리 생성 후에 Discord 봇 토큰 설정

```bash
DISCORD_TOKEN=your-discord-bot-token-here
```

5. 봇 실행
```bash
node index.js
```

---

## 사용법

- 음성 채널에 접속한 상태에서 텍스트 채널에 아래 명렁어 입력
```bash
!play < 유튜브 링크 또는 검색어 >
```

- ex)
```bash
!play https://www.yotube.com/watch?v=asdasd
!play QWER 눈물참기
```

- 봇이 음성 채널에 들어가 노래를 재생하고, 재생 목록에 추가된 곡들을 순서대로 플레이합니다.
- 재생목록에 추가된 노래를 모두 재생하면 자동으로 봇이 음성채널에서 퇴장합니다.

---

## 주요 코드 설명

- `queueMap` : 길드별로 음성 연결, 플레이어, 재생 대기열을 관리하는 Map 객체
- `getAudioStreamUrl(videoUrl)` : `yt-dlp` 실행하여 최적 오디오 스트림 URL 얻음
- `playNext(guildId)` : 대기열에서 다음 곡 꺼내서 재생, 재생 종료시 자동 호출
- 메시지 이벤트 처리에서 `!play` 명령어 인식 및 검색 / 재생 큐에 추가
- 각종 에러 처리 및 로그 출력 포함

---

## 참고

- `yt-dlp.exe`는 [yt-dlp Github](https://github.com/yt-dlp/yt-dlp)에서 다운로드 가능
- Windows 기준 `yt-dlp.exe` 경로 설정은 `process.env.PATH`에 `__dirname` 추가해 사용
- Linux/Mac 환경에서는 실행 파일명과 경로를 적절히 수정 필요

---