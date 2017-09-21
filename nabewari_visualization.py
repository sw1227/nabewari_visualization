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

@app.route('/mapbox')
def mapbox():
    title = "Mapbox"
    return render_template('mapbox.html', title=title)

@app.route('/leaflet')
def leaflet():
    title = "Leaflet"
    return render_template('leaflet.html', title=title)

@app.route('/relief')
def relief():
    title = "Relief Map"
    return render_template('relief.html', title=title)

