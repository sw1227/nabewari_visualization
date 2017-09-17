# -*- coding: utf-8 -*-
from flask import Flask, url_for, request, render_template
app = Flask(__name__)

@app.route('/')
def index():
    title = "Nabewari"
    return render_template('index.html', title=title)
