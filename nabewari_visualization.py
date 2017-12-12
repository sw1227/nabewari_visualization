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

@app.route('/points')
def points():
    title = "3D Point Cloud"
    return render_template('points.html', title=title)

@app.route('/wireframe')
def wireframe():
    title = "3D Wire Frame"
    return render_template('wireframe.html', title=title)

@app.route('/gpx')
def gpx():
    title = "GPX"
    return render_template('gpx.html', title=title)

@app.route('/delaunay')
def delaunay():
    title = "Delaunay"
    return render_template('delaunay.html', title=title)
