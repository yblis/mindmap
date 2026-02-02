from flask import Flask, render_template, request, jsonify, redirect, url_for
import db
import os

app = Flask(__name__)

# Initialize DB on startup
with app.app_context():
    db.init_db()

@app.route('/')
def index():
    # Regular home page - mode EDIT
    return render_template('index.html', mode='edit', initial_data=None)

@app.route('/manifest.json')
def serve_manifest():
    return app.send_static_file('manifest.json')

@app.route('/sw.js')
def serve_sw():
    return app.send_static_file('sw.js')

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('icons/favicon.ico')

@app.route('/view/<token>')
def view_map(token):
    # Shared view - mode READ-ONLY
    data = db.get_map(token)
    if not data:
        return "Mindmap not found", 404
    return render_template('index.html', mode='view', initial_data=data)

@app.route('/api/share', methods=['POST'])
def share_map():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    token = db.save_map(data)
    return jsonify({"token": token, "url": url_for('view_map', token=token, _external=True)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
