import google.generativeai as genai
import os

genai.configure(api_key="AIzaSyD2T-2WaoJ-Il9r7PFBv0l7_sxAcu_NbdE")

model = genai.GenerativeModel("gemini-1.5-flash")
response = model.generate_content("Write a story about a magic backpack.")
print(response.text)