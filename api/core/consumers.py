# core/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import asyncio
from django.utils import timezone
from .models import Battle, BattleParticipant, BattleQuestion, BattleAnswer, Question, Option, User
from .serializers import BattleSerializer

class QuizConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.quiz_id = self.scope['url_route']['kwargs']['quiz_id']
        self.quiz_group_name = f'quiz_{self.quiz_id}'
        
        await self.channel_layer.group_add(
            self.quiz_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.quiz_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']
        
        if message_type == 'user_joined':
            await self.channel_layer.group_send(
                self.quiz_group_name,
                {
                    'type': 'user_joined_message',
                    'user': data['user']
                }
            )
        elif message_type == 'answer_submitted':
            await self.channel_layer.group_send(
                self.quiz_group_name,
                {
                    'type': 'answer_submitted_message',
                    'user': data['user'],
                    'question': data['question']
                }
            )
    
    async def user_joined_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user']
        }))
    
    async def answer_submitted_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'answer_submitted',
            'user': event['user'],
            'question': event['question']
        }))
        
        


class BattleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.battle_code = self.scope['url_route']['kwargs']['battle_code']
        self.battle_group_name = f'battle_{self.battle_code}'
        
        # Join battle group
        await self.channel_layer.group_add(
            self.battle_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send current battle state
        battle = await self.get_battle()
        if battle:
            await self.send_battle_state(battle)
    
    async def disconnect(self, close_code):
        # Leave battle group
        await self.channel_layer.group_discard(
            self.battle_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'player_ready':
                await self.handle_player_ready(data)
            elif message_type == 'submit_answer':
                await self.handle_submit_answer(data)
            elif message_type == 'chat_message':
                await self.handle_chat_message(data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
    
    async def handle_player_ready(self, data):
        """Handle player ready status"""
        user = self.scope['user']
        battle = await self.get_battle()
        
        if battle and user.is_authenticated:
            participant = await self.get_participant(battle, user)
            if participant:
                await self.mark_participant_ready(participant)
                
                # Check if both players are ready to start
                if await self.both_players_ready(battle):
                    await self.start_battle(battle)
                
                await self.broadcast_battle_state(battle)
    
    async def handle_submit_answer(self, data):
        """Handle answer submission"""
        user = self.scope['user']
        battle = await self.get_battle()
        question_id = data.get('question_id')
        selected_options = data.get('selected_options', [])
        time_taken = data.get('time_taken', 0)
        
        if battle and user.is_authenticated and battle.status == 'active':
            participant = await self.get_participant(battle, user)
            if participant:
                await self.process_answer(battle, participant, question_id, selected_options, time_taken)
                await self.broadcast_battle_state(battle)
    
    async def handle_chat_message(self, data):
        """Handle chat messages"""
        user = self.scope['user']
        message = data.get('message', '')
        
        if user.is_authenticated and message.strip():
            await self.channel_layer.group_send(
                self.battle_group_name,
                {
                    'type': 'chat_message',
                    'user': user.username,
                    'message': message,
                    'timestamp': timezone.now().isoformat()
                }
            )
    
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'user': event['user'],
            'message': event['message'],
            'timestamp': event['timestamp']
        }))
    
    async def battle_state_update(self, event):
        """Send battle state update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'battle_state_update',
            'battle': event['battle']
        }))
    
    async def question_start(self, event):
        """Notify clients that a new question has started"""
        await self.send(text_data=json.dumps({
            'type': 'question_start',
            'question_index': event['question_index'],
            'question': event['question'],
            'time_limit': event['time_limit']
        }))
    
    async def battle_completed(self, event):
        """Notify clients that battle has completed"""
        await self.send(text_data=json.dumps({
            'type': 'battle_completed',
            'results': event['results']
        }))
    
    # Database operations
    @database_sync_to_async
    def get_battle(self):
        try:
            return Battle.objects.select_related('creator', 'opponent', 'subject').prefetch_related(
                'participants', 'participants__user', 'questions'
            ).get(battle_code=self.battle_code)
        except Battle.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_participant(self, battle, user):
        try:
            return BattleParticipant.objects.get(battle=battle, user=user)
        except BattleParticipant.DoesNotExist:
            return None
    
    @database_sync_to_async
    def mark_participant_ready(self, participant):
        participant.is_ready = True
        participant.save()
    
    @database_sync_to_async
    def both_players_ready(self, battle):
        participants = battle.participants.all()
        return participants.count() == 2 and all(p.is_ready for p in participants)
    
    @database_sync_to_async
    def start_battle(self, battle):
        if battle.status == 'waiting':
            battle.status = 'active'
            battle.started_at = timezone.now()
            battle.save()
    
    @database_sync_to_async
    def process_answer(self, battle, participant, question_id, selected_options, time_taken):
        try:
            question = Question.objects.get(id=question_id)
            selected_option_objs = Option.objects.filter(id__in=selected_options)
            
            # Check if answer is correct
            correct_options = question.options.filter(is_correct=True)
            is_correct = set(selected_option_objs) == set(correct_options)
            
            # Calculate score (base points + time bonus)
            base_points = question.marks if is_correct else 0
            time_bonus = max(0, (battle.time_per_question - time_taken) / battle.time_per_question * 10)
            points_earned = base_points + time_bonus
            
            # Create or update battle answer
            battle_answer, created = BattleAnswer.objects.get_or_create(
                battle=battle,
                participant=participant,
                question=question
            )
            battle_answer.selected_options.set(selected_option_objs)
            battle_answer.is_correct = is_correct
            battle_answer.time_taken = time_taken
            battle_answer.save()
            
            # Update participant stats
            participant.score += points_earned
            participant.total_time += time_taken
            if is_correct:
                participant.correct_answers += 1
            participant.save()
            
        except (Question.DoesNotExist, Option.DoesNotExist):
            pass
    
    # Helper methods
    async def send_battle_state(self, battle):
        """Send current battle state to client"""
        serializer = BattleSerializer(battle)
        await self.send(text_data=json.dumps({
            'type': 'battle_state',
            'battle': serializer.data
        }))
    
    async def broadcast_battle_state(self, battle):
        """Broadcast battle state to all clients in group"""
        serializer = BattleSerializer(battle)
        await self.channel_layer.group_send(
            self.battle_group_name,
            {
                'type': 'battle_state_update',
                'battle': serializer.data
            }
        )