import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình trong biến môi trường máy chủ.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleGeminiError(res: express.Response, error: unknown) {
  const errObj = error as { status?: number; message?: string };
  const status = typeof errObj?.status === 'number' ? errObj.status : 500;
  const message =
    error instanceof Error ? error.message : 'Không thể kết nối tới dịch vụ Gemini AI.';
  console.error('Gemini API error:', message);
  res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
}

interface CoachTurn {
  role: 'user' | 'assistant';
  content: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'edu-smart' });
  });

  // 1. Multi-turn Socratic AI Coach (gemini-4-hydrogen + ThinkingLevel.HIGH, no maxOutputTokens)
  app.post('/api/gemini/coach', async (req, res) => {
    try {
      const { subject, topic, studentHypothesis, message, history } = req.body as {
        subject?: string;
        topic?: string;
        studentHypothesis?: string;
        message?: string;
        history?: CoachTurn[];
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Nội dung câu hỏi không được để trống.' });
      }
      if (message.length > 4000) {
        return res.status(400).json({ error: 'Nội dung câu hỏi vượt quá giới hạn 4000 ký tự.' });
      }

      const ai = getGeminiClient();
      const safeSubject = (subject || 'Tổng hợp').slice(0, 60);
      const safeTopic = (topic || 'Chủ đề tự học').slice(0, 200);
      const safeHypothesis = (studentHypothesis || '').slice(0, 3000);

      const systemInstruction = [
        'Bạn là Trợ lý AI Coach của nền tảng EDU SMART dành cho học sinh Trường PTDTNT THPT Quảng Nam.',
        'Nguyên tắc sư phạm Socratic:',
        '1. Không giải hộ trọn vẹn hay đưa ngay đáp án cuối cùng nếu học sinh chưa tự lập luận.',
        '2. Luôn khen ngợi điểm hợp lý trong suy nghĩ ban đầu (Think First) của học sinh, chỉ ra lỗ hổng tư duy nhẹ nhàng và đặt 1–2 câu hỏi gợi mở từng bước.',
        '3. Khuyến khích học sinh đối chiếu lại sách giáo khoa (SGK Chương trình GDPT 2018) và giải thích bằng ngôn ngữ của chính mình.',
        '4. Trả lời bằng tiếng Việt rõ ràng, súc tích, thân thiện và chuẩn mực sư phạm (khoảng 120–250 từ).',
        `Môn học: ${safeSubject}. Chủ đề: ${safeTopic}.`,
        safeHypothesis
          ? `Lập luận Think First ban đầu của học sinh: "${safeHypothesis}"`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const sanitizedHistory = Array.isArray(history)
        ? history
            .filter(
              (turn) =>
                turn &&
                (turn.role === 'user' || turn.role === 'assistant') &&
                typeof turn.content === 'string' &&
                turn.content.trim().length > 0
            )
            .slice(-16)
            .map((turn) => ({
              role: turn.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: turn.content.slice(0, 3000) }],
            }))
        : [];

      const chat = ai.chats.create({
        model: 'gemini-4-hydrogen',
        history: sanitizedHistory,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
      });

      const response = await chat.sendMessage({ message: message.trim() });
      res.json({
        reply: response.text ?? 'Hãy thử phân tích lại giả thuyết của em từng bước một nhé.',
        modelUsed: 'gemini-4-hydrogen (High Thinking)',
      });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // 2. Fast Study Plan / Quick Hint Generator (gemini-3.1-flash-lite)
  app.post('/api/gemini/quick-hint', async (req, res) => {
    try {
      const { subject, title, goal } = req.body as {
        subject?: string;
        title?: string;
        goal?: string;
      };

      if (!title || typeof title !== 'string' || title.trim().length < 2) {
        return res.status(400).json({ error: 'Vui lòng nhập tên nhiệm vụ học tập.' });
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Môn: ${(subject || 'Tổng hợp').slice(0, 60)}\nNhiệm vụ: ${title.slice(0, 160)}\nMục tiêu: ${(goal || '').slice(0, 400)}\nHãy đề xuất 3 bước tự học cụ thể (gồm bước Think First, đọc SGK, và tự kiểm tra) trong 100 từ bằng tiếng Việt.`,
        config: {
          systemInstruction:
            'Bạn là cố vấn lập kế hoạch tự học ngắn gọn cho học sinh THPT. Trả lời 3 gạch đầu dòng rõ ràng, thiết thực.',
        },
      });

      res.json({
        suggestion: response.text ?? '',
        modelUsed: 'gemini-3.1-flash-lite',
      });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // 3. Deep Fact Check Review (gemini-4-hydrogen + ThinkingLevel.HIGH, no maxOutputTokens)
  app.post('/api/gemini/fact-check', async (req, res) => {
    try {
      const { subject, aiClaim, textbookSource, studentArgument } = req.body as {
        subject?: string;
        aiClaim?: string;
        textbookSource?: string;
        studentArgument?: string;
      };

      if (!aiClaim || !textbookSource || !studentArgument) {
        return res.status(400).json({ error: 'Thiếu thông tin cần kiểm chứng.' });
      }

      const ai = getGeminiClient();
      const prompt = [
        `Môn học: ${String(subject || 'Tổng hợp').slice(0, 60)}`,
        `Thông tin/Nhận định từ AI cần kiểm chứng: "${String(aiClaim).slice(0, 1500)}"`,
        `Nguồn SGK / tài liệu học sinh đối chiếu: "${String(textbookSource).slice(0, 300)}"`,
        `Lập luận phản biện của học sinh: "${String(studentArgument).slice(0, 2000)}"`,
        'Hãy đánh giá tính chính xác của nhận định gốc và chất lượng lập luận đối chiếu của học sinh. Nêu rõ điểm chính xác, điểm cần lưu ý thêm theo chuẩn kiến thức THPT, và gợi ý 1 câu hỏi đào sâu.',
      ].join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Bạn là chuyên gia thẩm định học liệu THPT (Fact Check Coach). Phân tích khách quan, chuẩn xác, khuyến khích tư duy phản biện của học sinh bằng tiếng Việt.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
      });

      res.json({
        review: response.text ?? '',
        modelUsed: 'gemini-4-hydrogen (High Thinking)',
      });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // 4. Self Test Evaluation (gemini-4-hydrogen structured JSON)
  app.post('/api/gemini/evaluate-self-test', async (req, res) => {
    try {
      const { subject, topic, questionPrompt, studentExplanation, applicationAnswer } = req.body as {
        subject?: string;
        topic?: string;
        questionPrompt?: string;
        studentExplanation?: string;
        applicationAnswer?: string;
      };

      if (!questionPrompt || !studentExplanation || !applicationAnswer) {
        return res.status(400).json({ error: 'Vui lòng hoàn thành đầy đủ phần giải thích và vận dụng.' });
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          `Môn: ${String(subject || '').slice(0, 60)} | Chủ đề: ${String(topic || '').slice(0, 180)}`,
          `Câu hỏi tự kiểm tra: ${String(questionPrompt).slice(0, 800)}`,
          `Học sinh tự giải thích bằng ngôn ngữ bản thân: ${String(studentExplanation).slice(0, 3000)}`,
          `Học sinh vận dụng vào tình huống mới: ${String(applicationAnswer).slice(0, 3000)}`,
        ].join('\n\n'),
        config: {
          systemInstruction:
            'Bạn là giáo viên đánh giá bài Self Test (tự kiểm tra không có AI) theo thang điểm 0–100. Chấm công tâm dựa trên mức độ hiểu bản chất, diễn đạt bằng ngôn ngữ cá nhân và tính hợp lý của ví dụ vận dụng.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: 'Điểm đánh giá từ 0 đến 100.',
              },
              strengths: {
                type: Type.STRING,
                description: 'Điểm mạnh trong câu trả lời của học sinh.',
              },
              gaps: {
                type: Type.STRING,
                description: 'Kiến thức còn thiếu hoặc cần làm rõ hơn.',
              },
              nextStep: {
                type: Type.STRING,
                description: 'Gợi ý bước ôn tập tiếp theo.',
              },
            },
            required: ['score', 'strengths', 'gaps', 'nextStep'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        score?: number;
        strengths?: string;
        gaps?: string;
        nextStep?: string;
      };

      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 75))));
      const feedbackSummary = [
        parsed.strengths ? `Điểm mạnh: ${parsed.strengths}` : '',
        parsed.gaps ? `Cần bổ sung: ${parsed.gaps}` : '',
        parsed.nextStep ? `Gợi ý tiếp theo: ${parsed.nextStep}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      res.json({
        score,
        feedbackSummary: feedbackSummary || 'Đã ghi nhận bài tự kiểm tra.',
        modelUsed: 'gemini-4-hydrogen',
      });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EDU SMART server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
