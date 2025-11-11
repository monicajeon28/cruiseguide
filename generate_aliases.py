import os
import json
import re

def normalize_python(s: str) -> str:
    # '호' 접미사 제거 및 특수 문자, 공백 제거 후 소문자 변환
    return re.sub(r'호$', '', re.sub(r'[()\-_/·.\s]+', '', s)).lower().strip()

# Load existing aliases from the file
existing_aliases = {}
aliases_file_path = "data/media-aliases.json"
if os.path.exists(aliases_file_path):
    try:
        with open(aliases_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Convert lists to sets for easier merging
            existing_aliases = {k: set(v) for k, v in data.get('aliases', {}).items()}
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {aliases_file_path}. Starting with empty existing aliases.")
    except Exception as e:
        print(f"An unexpected error occurred while reading {aliases_file_path}: {e}. Starting with empty existing aliases.")

new_aliases = {}
media_root_path = "public/크루즈정보사진"

if os.path.exists(media_root_path):
    for root, dirs, files in os.walk(media_root_path):
        for dir_name in dirs:
            canonical_name = dir_name
            current_aliases = set()
            current_aliases.add(dir_name)
            current_aliases.add(normalize_python(dir_name))
            
            # Ensure proper handling for cases like "로얄캐리비안 스펙트럼호 객실사진"
            # where the '호' might be part of a larger name
            if '호' in dir_name and dir_name.endswith('호'):
                current_aliases.add(dir_name.replace('호', '').strip())
                current_aliases.add(normalize_python(dir_name.replace('호', '').strip()))

            new_aliases[canonical_name] = sorted(list(current_aliases))

# Merge new aliases with existing ones, prioritizing existing.
# Existing aliases that are also in new_aliases will retain their specific_aliases_from_user entries
merged_aliases = {k: set(v) for k, v in existing_aliases.items()}

for canonical, aliases_list in new_aliases.items():
    if canonical not in merged_aliases:
        merged_aliases[canonical] = set(aliases_list)
    else:
        # Only add new aliases, do not overwrite specific user-defined ones unless explicitly done
        merged_aliases[canonical].update(aliases_list)


# Add specific aliases from the user's request if they weren't automatically generated or existing
# These should override or extend automatically generated ones
specific_aliases_from_user = {
    "로얄캐리비안 퀀텀": ["퀀텀", "quantum", "퀀텀호", "로얄 퀀텀"],
    "로얄캐리비안 스펙트럼": ["스펙트럼", "spectrum", "스펙트럼호", "로얄 스펙트럼"],
    "로얄 오베이션": ["오베이션", "ovation", "오베이션호"],
    "로얄 브릴리앙스호": ["브릴리언스", "brilliance", "브릴리앙스"],
    "미국 애리조나 페이지": ["페이지", "page", "antelope", "홀스슈벤드", "horseshoe"],
    "스페인 바르셀로나": ["바르셀로나", "barcelona"],
    "스페인 발렌시아": ["발렌시아", "valencia"],
    "스페인 팔마": ["팔마", "palma"],
    "대만 기륭(지룽)": ["기륭", "지룽", "keelung"],
    "대한민국 제주도": ["제주", "jeju"],
    "덴마크 코펜하겐": ["코펜하겐", "copenhagen"],
    "도쿄 기항지관광 자료": ["도쿄", "tokyo", "오다이바", "odaiba"],
    "부산 크루즈 터미널 위치": ["부산항", "부산 터미널", "busan terminal"],
    "고객 후기 자료": ["후기", "리뷰", "review"]
}

for canonical, aliases_list in specific_aliases_from_user.items():
    if canonical not in merged_aliases:
        merged_aliases[canonical] = set(aliases_list)
        merged_aliases[canonical].add(canonical)
        merged_aliases[canonical].add(normalize_python(canonical))
    else:
        current_set = merged_aliases[canonical]
        current_set.update(aliases_list)
        current_set.add(canonical)
        current_set.add(normalize_python(canonical))
        merged_aliases[canonical] = current_set

# Convert sets back to sorted lists
final_aliases = {k: sorted(list(v)) for k, v in merged_aliases.items()}

output_json = {"aliases": final_aliases}
# Ensure the data directory exists
os.makedirs(os.path.dirname(aliases_file_path), exist_ok=True)
with open(aliases_file_path, 'w', encoding='utf-8') as f:
    json.dump(output_json, f, indent=2, ensure_ascii=False)

print(f"Generated aliases saved to {aliases_file_path}") 