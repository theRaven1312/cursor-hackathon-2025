import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { optionalAuth } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// System prompt for location suggestions
const SYSTEM_PROMPT = `Bạn là một trợ lý du lịch AI chuyên về Việt Nam, đặc biệt là TP. Hồ Chí Minh và các vùng lân cận.

Nhiệm vụ: Khi người dùng hỏi về địa điểm, bạn sẽ gợi ý 3-5 địa điểm phù hợp nhất.

QUAN TRỌNG: Bạn PHẢI trả về JSON hợp lệ theo format sau (không có text nào khác):
{
  "message": "Tin nhắn thân thiện cho người dùng (tiếng Việt)",
  "suggestions": [
    {
      "name": "Tên địa điểm",
      "description": "Mô tả ngắn gọn (1-2 câu)",
      "rating": 4.5,
      "lat": 10.7721,
      "lng": 106.6980
    }
  ]
}

Quy tắc:
1. Luôn trả về tọa độ thực và chính xác của địa điểm tại Việt Nam
2. Rating từ 1-5 (dựa trên độ phổ biến và đánh giá thực tế)
3. Mô tả ngắn gọn, hữu ích bằng tiếng Việt
4. Nếu không tìm được địa điểm phù hợp, trả về suggestions là mảng rỗng
5. Ưu tiên các địa điểm ở TP.HCM nếu người dùng không chỉ định vùng khác
6. KHÔNG thêm markdown, chỉ JSON thuần túy`;

// AI suggestion endpoint using Gemini
router.post('/suggest', optionalAuth, async (req, res) => {
  try {
    const { query, latitude, longitude } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Build user prompt
    let userPrompt = `Người dùng hỏi: "${query.trim()}"`;
    
    if (latitude && longitude) {
      userPrompt += `\nVị trí hiện tại của người dùng: ${latitude}, ${longitude}`;
    }

    // Call Gemini API
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'Tôi hiểu. Tôi sẽ trả về JSON với các gợi ý địa điểm phù hợp.' }],
        },
      ],
    });

    const result = await chat.sendMessage(userPrompt);
    const responseText = result.response.text();
    
    // Parse JSON response
    let aiResponse;
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Fallback response
      aiResponse = {
        message: 'Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại với câu hỏi khác!',
        suggestions: []
      };
    }

    // Format suggestions
    const formattedSuggestions = (aiResponse.suggestions || []).map(s => ({
      name: s.name,
      description: s.description,
      rating: s.rating || 4.0,
      location: { lat: s.lat, lng: s.lng }
    }));

    res.json({
      message: aiResponse.message,
      suggestions: formattedSuggestions
    });

  } catch (error) {
    console.error('AI suggestion error:', error);
    
    // Fallback to local suggestions if Gemini fails
    const fallbackResponse = getFallbackSuggestions(req.body.query);
    res.json(fallbackResponse);
  }
});

// Fallback suggestions when Gemini is unavailable
const getFallbackSuggestions = (query) => {
  const lowerQuery = query?.toLowerCase() || '';
  
  const FALLBACK_DB = {
    'cafe': [
      { name: 'The Coffee House - Nguyễn Huệ', description: 'Quán cà phê view đẹp ngay trung tâm', rating: 4.5, location: { lat: 10.7736, lng: 106.7032 } },
      { name: 'Highlands Coffee - Bitexco', description: 'Cà phê trên tầng cao Bitexco Tower', rating: 4.3, location: { lat: 10.7718, lng: 106.7045 } },
    ],
    'ăn': [
      { name: 'Chợ Bến Thành', description: 'Khu ẩm thực đa dạng với nhiều món địa phương', rating: 4.2, location: { lat: 10.7721, lng: 106.6980 } },
      { name: 'Phố ẩm thực Vĩnh Khánh', description: 'Thiên đường hải sản và đồ nướng', rating: 4.5, location: { lat: 10.7565, lng: 106.6932 } },
    ],
    'tham quan': [
      { name: 'Nhà thờ Đức Bà', description: 'Công trình kiến trúc Gothic nổi tiếng', rating: 4.8, location: { lat: 10.7798, lng: 106.6990 } },
      { name: 'Dinh Độc Lập', description: 'Di tích lịch sử quan trọng', rating: 4.7, location: { lat: 10.7770, lng: 106.6953 } },
    ],
  };

  let suggestions = [];
  for (const [keyword, locations] of Object.entries(FALLBACK_DB)) {
    if (lowerQuery.includes(keyword)) {
      suggestions = [...suggestions, ...locations];
    }
  }

  if (suggestions.length === 0) {
    suggestions = FALLBACK_DB['tham quan'];
  }

  return {
    message: suggestions.length > 0 
      ? `Đây là một số gợi ý cho bạn:` 
      : 'Xin lỗi, tôi không tìm được địa điểm phù hợp.',
    suggestions: suggestions.slice(0, 5)
  };
};

// Get suggestion categories
router.get('/categories', (req, res) => {
  res.json({
    categories: [
      { name: 'Quán cà phê', icon: '☕', query: 'quán cà phê ngon view đẹp' },
      { name: 'Ăn uống', icon: '🍜', query: 'quán ăn ngon nổi tiếng' },
      { name: 'Tham quan', icon: '🏛️', query: 'địa điểm tham quan du lịch' },
      { name: 'Mua sắm', icon: '🛍️', query: 'trung tâm mua sắm' },
      { name: 'Giải trí', icon: '🎮', query: 'khu vui chơi giải trí' },
      { name: 'Thiên nhiên', icon: '🌳', query: 'công viên thiên nhiên' },
    ]
  });
});

// Chat with AI (general conversation)
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Bạn là trợ lý du lịch GeoSnap, chuyên tư vấn về địa điểm ở Việt Nam. Trả lời thân thiện bằng tiếng Việt.' }],
        },
        {
          role: 'model', 
          parts: [{ text: 'Xin chào! Tôi là trợ lý du lịch GeoSnap. Tôi sẵn sàng giúp bạn khám phá những địa điểm tuyệt vời ở Việt Nam!' }],
        },
        ...chatHistory
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({
      message: responseText
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable',
      message: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!'
    });
  }
});

export default router;
