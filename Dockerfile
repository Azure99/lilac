#FROM rocm/pytorch:rocm6.3_ubuntu22.04_py3.10_pytorch_release_2.4.0
FROM python:3.10-slim-bullseye

ENV PYTHONUNBUFFERED True

WORKDIR /app

RUN python -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple "lilac[embeddings,llms,sources,gmail,langsmith,signals,lang_detection,pii,text_stats,gte,bge,nomic,sbert,cohere,openai]"

RUN python -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple "lilac[github]"

COPY LICENSE .

EXPOSE 7841
CMD ["uvicorn", "lilac.server:app", "--host", "127.0.0.1", "--port", "7841"]
