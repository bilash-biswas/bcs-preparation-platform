import os
import requests
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def get_gemini_api_key():
    return getattr(settings, 'GEMINI_API_KEY', '')

def call_gemini_api(prompt, system_instruction=None, response_schema=None):
    """
    Call Gemini 2.5 Flash API with optional system instructions and response schema (structured JSON output).
    """
    api_key = get_gemini_api_key()
    if not api_key:
        logger.warning("GEMINI_API_KEY is not configured in settings.")
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    contents = {
        "parts": [{"text": prompt}]
    }
    
    payload = {
        "contents": [contents],
        "generationConfig": {}
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
        
    if response_schema:
        payload["generationConfig"]["responseMimeType"] = "application/json"
        
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            res_json = response.json()
            try:
                text_out = res_json['candidates'][0]['content']['parts'][0]['text']
                return text_out
            except (KeyError, IndexError) as e:
                logger.error(f"Failed to parse Gemini API response: {e}, Response: {res_json}")
                return None
        else:
            logger.error(f"Gemini API returned status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Exception during Gemini API call: {e}")
        return None

def generate_ai_explanation(question_text, options_list, correct_option_text):
    """
    Generate an explanation for a BCS question.
    """
    prompt = (
        f"Question: {question_text}\n"
        f"Options: {', '.join(options_list)}\n"
        f"Correct Answer: {correct_option_text}\n\n"
        "Please generate a simple, concise, and direct explanation for this question in Bengali. "
        "Explain directly why the correct option is correct in 2-3 short, clear sentences. "
        "Keep it highly focused without any introductory greetings, detailed secondary tips, or extra paragraphs."
    )
    
    system_instruction = (
        "You are an expert BCS (Bangladesh Civil Service) exam preparation tutor. "
        "Your task is to explain the given question clearly, simply, and concisely in polite Bengali. "
        "Do not write long essays. Keep the explanation straight to the point, direct, and restricted to 2-3 sentences max."
    )
    
    return call_gemini_api(prompt, system_instruction=system_instruction)

def generate_ai_recommendations_data(user_progress_summary, available_subjects):
    """
    Generate learning recommendations using Gemini.
    """
    prompt = (
        f"User Progress Metrics:\n{json.dumps(user_progress_summary, indent=2)}\n\n"
        f"Available Subjects:\n{json.dumps(available_subjects, indent=2)}\n\n"
        "Analyze the user's progress and identify their learning needs. Recommend 3 distinct subjects they should focus on next.\n"
        "For each recommendation, provide: \n"
        "1. subject: The exact name of the subject (from the list of available subjects).\n"
        "2. recommendation_type: One of 'weak_area', 'revision', 'challenge', or 'concept'.\n"
        "3. priority: An integer from 1 to 10 (higher means more urgent).\n"
        "4. confidence_score: A float between 0.0 and 1.0 representing your confidence.\n"
        "5. reason: A personalized, encouraging reason in Bengali explaining why they should study this subject.\n\n"
        "Return the response ONLY as a JSON list of objects matching this exact structure."
    )
    
    system_instruction = (
        "You are an expert educational recommender system. Your goal is to guide students preparing for the BCS exam "
        "by recommending subjects based on their past accuracy and study history. "
        "You must return a valid JSON array of objects. Do not wrap the JSON in Markdown blockquotes. "
        "Each object must have the fields: 'subject', 'recommendation_type', 'priority', 'confidence_score', and 'reason'."
    )
    
    raw_response = call_gemini_api(prompt, system_instruction=system_instruction, response_schema=True)
    if raw_response:
        try:
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse recommendations JSON from Gemini: {e}. Raw response: {raw_response}")
            return None
    return None
