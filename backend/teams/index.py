import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: CRUD operations for IHL hockey teams
    Args: event - dict with httpMethod, body, pathParams
          context - object with request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            cursor.execute('SELECT * FROM teams ORDER BY position ASC')
            teams = cursor.fetchall()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(team) for team in teams], default=serialize_datetime),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            cursor.execute(
                '''INSERT INTO teams 
                   (name, logo_url, games_played, wins, losses, ot_losses, goals_for, goals_against, position) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) 
                   RETURNING *''',
                (
                    body_data.get('name'),
                    body_data.get('logo_url'),
                    body_data.get('games_played', 0),
                    body_data.get('wins', 0),
                    body_data.get('losses', 0),
                    body_data.get('ot_losses', 0),
                    body_data.get('goals_for', 0),
                    body_data.get('goals_against', 0),
                    body_data.get('position', 0)
                )
            )
            conn.commit()
            new_team = cursor.fetchone()
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(new_team), default=serialize_datetime),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            path_params = event.get('pathParams', {})
            team_id = path_params.get('id')
            body_data = json.loads(event.get('body', '{}'))
            
            cursor.execute(
                '''UPDATE teams 
                   SET name = %s, logo_url = %s, games_played = %s, wins = %s, 
                       losses = %s, ot_losses = %s, goals_for = %s, goals_against = %s, 
                       position = %s, updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s 
                   RETURNING *''',
                (
                    body_data.get('name'),
                    body_data.get('logo_url'),
                    body_data.get('games_played', 0),
                    body_data.get('wins', 0),
                    body_data.get('losses', 0),
                    body_data.get('ot_losses', 0),
                    body_data.get('goals_for', 0),
                    body_data.get('goals_against', 0),
                    body_data.get('position', 0),
                    team_id
                )
            )
            conn.commit()
            updated_team = cursor.fetchone()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(updated_team) if updated_team else {}, default=serialize_datetime),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            path_params = event.get('pathParams', {})
            team_id = path_params.get('id')
            
            cursor.execute('DELETE FROM teams WHERE id = %s', (team_id,))
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cursor.close()
        conn.close()