const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  const { prompt } = JSON.parse(event.body);

  const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: prompt })
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ text: data[0]?.generated_text || "AI did not return text." })
  };
};
