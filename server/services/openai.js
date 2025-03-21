const { OpenAI } = require("openai");
const getOpenAIResponse = async (record, user_query, language = 'en-US') => {
    try {
      // Configure your OpenAI API integration
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      // Destructure all needed fields from the record
      const { description, subject, chapter, standard, image_url, title, fig_no } = record;
      
      if (!image_url) {
        throw new Error("Image URL not found in the record");
      }
      
      // Construct the messages array with both text and image
      const messages = [
        {
          role: "system", 
          content: "You are a concise mathematics teacher helping visually impaired and blind students. Provide brief, clear answers without formatting, markdown, or special characters. Focus on essential information only."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Context: ${subject}, ${standard}, Chapter: ${chapter}, Figure ${fig_no}
              
              Original description: "${description}"
              
              Question: "${user_query}"
              
              Preferred language: ${language || 'en-US'}
              
              Provide a brief, direct answer that is:
              1. Screen-reader friendly (no special formatting or symbols)
              2. Under 3 sentences where possible
              3. Uses plain language suitable for grade ${standard}
              4. Focuses only on the specific question asked
              5. Avoids unnecessary repetition of context
              
              Answer the question directly without any introductory phrases or conclusions.`
            },
            {
              type: "image_url",
              image_url: {
                url: image_url,
                detail: "high"
              }
            }
          ]
        }
      ];
      
      // Make the API call to OpenAI using GPT-4 Vision
      const response = await openai.chat.completions.create({
        model: "gpt-4.5-preview",
        messages: messages,
        temperature: 0.3,
        max_tokens: 200
      });
      
      // Extract and return the AI response text
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error in OpenAI call:", error);
      throw new Error("Failed to get response from AI service: " + error.message);
    }
  };

  module.exports = { getOpenAIResponse };