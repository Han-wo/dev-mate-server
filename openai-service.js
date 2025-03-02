const axios = require("axios");

/**
 * 파일 확장자 추출 함수
 */
function getFileExtension(fileName) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

/**
 * 파일 타입 확인 함수
 */
function getFileType(fileName) {
  const ext = getFileExtension(fileName);
  return ["md", "markdown", "txt"].includes(ext) ? "markdown" : "code";
}

/**
 * OpenAI API를 사용해 코드 분석
 */
async function analyzeCode(apiKey, fileName, fileContent) {
  const fileType = getFileType(fileName);
  const fileExt = getFileExtension(fileName);
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

  try {
    // 파일 타입에 따른 시스템 프롬프트 설정
    let systemPrompt = "";

    if (fileType === "code") {
      systemPrompt = `당신은 개발자 학습을 도와주는 AI 튜터입니다. 
      주어진 코드 파일을 분석하여 다음 항목을 포함한 학습 노트를 생성해주세요:
      
      1. 파일 개요: 이 파일의 목적과 주요 기능
      2. 주요 학습 포인트: 이 코드에서 배울 수 있는 중요 개념과 패턴(각 항목은 구체적이고 실용적이어야 함)
      3. 기술 스택: 사용된 주요 라이브러리, 프레임워크, 패턴
      4. 코드 설명: 주요 코드 블록에 대한 상세한 설명(핵심 함수와 로직 위주)
      ${
        fileExt === "ts" ||
        fileExt === "js" ||
        fileExt === "tsx" ||
        fileExt === "jsx"
          ? `5. 코드 최적화: 성능 개선 가능 부분과 리팩토링 제안사항`
          : ""
      }
      6. 학습 퀴즈: 이 코드와 관련된 5개의 퀴즈 문제로, 다음 유형을 각각 포함해야 합니다:
         - 3개의 객관식 문제: 각 문제는 4개의 보기와 정답 번호(0-3), 그리고 해설을 포함
         - 1개의 단답형 문제: 정확한 답변과 해설, 그리고 허용 가능한 답변 목록을 포함
         - 1개의 서술형 문제: 모범 답안과 평가에 사용될 핵심 포인트를 포함
      
      중요: 모든 응답은 반드시 한국어로 작성해주세요. 코드에 대한 분석과 퀴즈 모두 한국어로 제공해야 합니다.
      매 분석마다 서로 다른 문제를 출제해야 합니다(동일한 패턴의 문제가 반복되지 않도록 하세요).
      
      결과는 다음 JSON 형식으로 반환해주세요:
      {
        "fileOverview": "파일 개요 텍스트",
        "learningPoints": ["학습 포인트1", "학습 포인트2", ...],
        "techStack": ["기술1", "기술2", ...],
        "codeExplanation": "코드 설명 텍스트",
        ${
          fileExt === "ts" ||
          fileExt === "js" ||
          fileExt === "tsx" ||
          fileExt === "jsx"
            ? `"optimizationTips": ["최적화 팁1", "최적화 팁2", ...],`
            : ""
        }
        "quizzes": [
          {
            "type": "multipleChoice",
            "question": "객관식 문제 내용",
            "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
            "answer": 정답 인덱스(0-3),
            "explanation": "정답 설명"
          },
          {
            "type": "shortAnswer",
            "question": "단답형 문제 내용",
            "answer": "정답",
            "acceptableAnswers": ["정답1", "정답2", "정답3"],
            "explanation": "정답 설명"
          },
          {
            "type": "essay",
            "question": "서술형 문제 내용",
            "sampleAnswer": "모범 답안 텍스트",
            "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
            "explanation": "채점 가이드 및 설명"
          }
        ]
      }`;
    } else {
      systemPrompt = `당신은 개발자 학습을 도와주는 AI 튜터입니다. 
      주어진 마크다운/텍스트 파일을 분석하여 다음 항목을 포함한 학습 노트를 생성해주세요:
      
      1. 문서 개요: 이 문서의 주요 주제와 목적
      2. 핵심 개념: 문서에서 다루는 주요 개념과 아이디어(5-7개)
      3. 주요 섹션 요약: 문서의 주요 섹션 및 그 내용 요약
      4. 학습 포인트: 이 문서에서 배울 수 있는 중요한 점
      5. 관련 기술/용어: 문서에 언급된 주요 기술이나 용어
      6. 학습 퀴즈: 이 문서와 관련된 5개의 퀴즈 문제로, 다음 유형을 각각 포함해야 합니다:
         - 3개의 객관식 문제: 각 문제는 4개의 보기와 정답 번호(0-3), 그리고 해설을 포함
         - 1개의 단답형 문제: 정확한 답변과 해설, 그리고 허용 가능한 답변 목록을 포함
         - 1개의 서술형 문제: 모범 답안과 평가에 사용될 핵심 포인트를 포함
      
      중요: 모든 응답은 반드시 한국어로 작성해주세요. 문서에 대한 분석과 퀴즈 모두 한국어로 제공해야 합니다.
      매 분석마다 서로 다른 문제를 출제해야 합니다(동일한 패턴의 문제가 반복되지 않도록 하세요).
      
      결과는 다음 JSON 형식으로 반환해주세요:
      {
        "fileOverview": "문서 개요 텍스트",
        "learningPoints": ["학습 포인트1", "학습 포인트2", ...],
        "keyTerms": ["용어1", "용어2", ...],
        "sectionSummary": "주요 섹션 요약 텍스트",
        "quizzes": [
          {
            "type": "multipleChoice",
            "question": "객관식 문제 내용",
            "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
            "answer": 정답 인덱스(0-3),
            "explanation": "정답 설명"
          },
          {
            "type": "shortAnswer",
            "question": "단답형 문제 내용",
            "answer": "정답",
            "acceptableAnswers": ["정답1", "정답2", "정답3"],
            "explanation": "정답 설명"
          },
          {
            "type": "essay",
            "question": "서술형 문제 내용",
            "sampleAnswer": "모범 답안 텍스트",
            "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
            "explanation": "채점 가이드 및 설명"
          }
        ]
      }`;
    }

    // API 요청
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `파일명: ${fileName}\n\n파일 내용:\n${fileContent}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 50000,
      }
    );

    // 결과 처리 및 반환
    const result = JSON.parse(response.data.choices[0].message.content);

    // optimizationTips 속성이 없을 경우 빈 배열 추가 (JS/TS 파일인 경우에만)
    if (
      fileType === "code" &&
      (fileExt === "ts" ||
        fileExt === "js" ||
        fileExt === "tsx" ||
        fileExt === "jsx") &&
      !result.optimizationTips
    ) {
      result.optimizationTips = [];
    }

    return result;
  } catch (error) {
    console.error("OpenAI API 오류:", error.response?.data || error.message);
    throw new Error("파일 분석 중 오류가 발생했습니다.");
  }
}

module.exports = { analyzeCode };
