## 프로젝트 소개
**STEAK**는 MySQL 데이터베이스의 데이터를 웹 환경에서 조회하고 관리할 수 있도록 개발한
**REST API 기반 Web Data Management Dashboard**

Node.js와 Express를 이용해 REST API 서버를 구성하고,
MySQL 데이터베이스의 테이블과 데이터를 동적으로 조회할 수 있도록 구현

Vanilla JavaScript의 Fetch API를 통해 서버와 통신하며,
Chart.js를 활용해 데이터베이스 및 사용자 통계를 시각적으로 확인할 수 있도록 구성

---

## 프로젝트 목적

기존에 제작한 Vinto 프로젝트의 MySQL 데이터베이스를 활용하면서,
단순히 웹 서비스에서 데이터를 저장하는 것에서 그치지 않고
데이터베이스의 데이터를 별도의 관리 페이지에서 조회하고 관리하는 시스템을 구현하고자 제작


## 사용 기술

#Frontend
- HTML5
- CSS3
- JavaScript
- Fetch API
- Chart.js

#Backend
- Node.js
- Express.js
- MySQL2
- dotenv
- cors

#Database
- MySQL

## 주요 기능

# MySQL 연결

환경변수를 이용하여 MySQL 데이터베이스와 연결
`.env` 파일을 이용해 DB 접속 정보를 소스 코드와 분리하여 관리하도록 구성

# DB 테이블 자동 조회
MySQL의 `SHOW TABLES`를 이용해 현재 데이터베이스에 존재하는 테이블 목록을 조회
조회된 테이블은 STEAK Dashboard의 사이드바에 자동으로 표시
따라서 특정 테이블 이름을 프론트엔드에 직접 작성하지 않아도
데이터베이스 구조에 따라 테이블 목록이 동적으로 생성

# Table 데이터 조회
사이드바에서 원하는 테이블을 선택하면 REST API를 통해 해당 테이블의 데이터를 조회
테이블의 컬럼 정보와 데이터를 가져와 JavaScript를 이용해 HTML Table을 동적으로 생성하도록 구현

# Data Search
조회된 데이터에서 원하는 값을 빠르게 찾을 수 있도록 검색 기능을 구현

# Data Delete
각 데이터의 Primary Key를 기준으로 특정 Row를 삭제할 수 있도록 구현
삭제 버튼을 클릭하면 사용자에게 삭제 여부를 확인한 후
DELETE API를 호출하여 MySQL 데이터 삭제

# 암호화 표시
password, passwd, secret, token, api_key 등
민감정보로 판단되는 컬럼은 Dashboard에서 직접 표시하지 않고 마스킹 처리하도록 구현했습니다.

# Dashboard 통계
현재 연결된 데이터베이스의 정보를 Dashboard에서 확인할 수 있도록 구현
- Database 이름
- Table 개수
- 전체 Row 개수
- Database 연결 상태

# 사용자 통계
users 테이블의 데이터를 이용하여 회원가입 통계를 확인할 수 있도록 구현
- 전체 사용자 수
- 오늘 가입한 사용자 수
- 최근 7일 가입자 수
- 최근 7일 가입자 추이
