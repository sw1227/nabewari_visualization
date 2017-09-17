# -*- coding: utf-8 -*-
from flask import Flask, url_for, request, render_template
app = Flask(__name__)

@app.route('/')
def index():
    title = "Nabewari Visualization"
    return render_template('index.html', title=title)

@app.route('/about')
def about():
    title = "About"
    return render_template('about.html', title=title)
