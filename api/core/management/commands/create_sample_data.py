# core/management/commands/create_sample_data.py
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from faker import Faker
from core.models import Category, Subject, Question, Option, Quiz, QuizAttempt, UserAnswer, UserProgress, Discussion
from users.models import User, UserProfile
from payment.models import PaymentPlan, Payment, UserSubscription, Coupon, CouponUsage, Transaction

fake = Faker()

class Command(BaseCommand):
    help = 'Create comprehensive sample data for BCS preparation app'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=50,
            help='Number of users to create'
        )
        parser.add_argument(
            '--questions',
            type=int,
            default=200,
            help='Number of questions to create'
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Creating sample data for BCS Preparation App...')
        
        # Create categories
        categories = self.create_categories()
        
        # Create subjects
        subjects = self.create_subjects(categories)
        
        # Create questions
        questions = self.create_questions(subjects, options['questions'])
        
        # Create users
        users = self.create_users(options['users'])
        
        # Create quizzes
        quizzes = self.create_quizzes(subjects)
        
        # Create quiz attempts and user progress
        self.create_quiz_data(users, quizzes, questions)
        
        # Create discussions
        self.create_discussions(users, questions)
        
        # Create payment data
        self.create_payment_data(users)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created comprehensive sample data!')
        )
    
    def create_categories(self):
        categories_data = [
            {'name': 'Bangla Literature', 'description': 'Bangla language and literature', 'color': '#FF6B6B'},
            {'name': 'English Language', 'description': 'English grammar and literature', 'color': '#4ECDC4'},
            {'name': 'Bangladesh Affairs', 'description': 'History and affairs of Bangladesh', 'color': '#45B7D1'},
            {'name': 'International Affairs', 'description': 'World history and current affairs', 'color': '#96CEB4'},
            {'name': 'General Science', 'description': 'Physics, Chemistry, Biology', 'color': '#FFEAA7'},
            {'name': 'Mathematics', 'description': 'General mathematics and mental ability', 'color': '#DDA0DD'},
            {'name': 'Geography', 'description': 'World geography and environment', 'color': '#98D8C8'},
            {'name': 'Computer & IT', 'description': 'Computer science and information technology', 'color': '#F7DC6F'},
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        return categories
    
    def create_subjects(self, categories):
        subjects_data = [
            # Bangla Literature
            {'name': 'Bangla Grammar', 'category': categories[0], 'priority': 1},
            {'name': 'Bangla Literature', 'category': categories[0], 'priority': 2},
            {'name': 'Bangla Poetry', 'category': categories[0], 'priority': 3},
            
            # English Language
            {'name': 'English Grammar', 'category': categories[1], 'priority': 1},
            {'name': 'Vocabulary', 'category': categories[1], 'priority': 2},
            {'name': 'Comprehension', 'category': categories[1], 'priority': 3},
            
            # Bangladesh Affairs
            {'name': 'Bangladesh History', 'category': categories[2], 'priority': 1},
            {'name': 'Liberation War', 'category': categories[2], 'priority': 2},
            {'name': 'Constitution', 'category': categories[2], 'priority': 3},
            
            # International Affairs
            {'name': 'World History', 'category': categories[3], 'priority': 1},
            {'name': 'Current Affairs', 'category': categories[3], 'priority': 2},
            {'name': 'International Organizations', 'category': categories[3], 'priority': 3},
            
            # General Science
            {'name': 'Physics', 'category': categories[4], 'priority': 1},
            {'name': 'Chemistry', 'category': categories[4], 'priority': 2},
            {'name': 'Biology', 'category': categories[4], 'priority': 3},
            
            # Mathematics
            {'name': 'Arithmetic', 'category': categories[5], 'priority': 1},
            {'name': 'Algebra', 'category': categories[5], 'priority': 2},
            {'name': 'Geometry', 'category': categories[5], 'priority': 3},
            
            # Geography
            {'name': 'World Geography', 'category': categories[6], 'priority': 1},
            {'name': 'Bangladesh Geography', 'category': categories[6], 'priority': 2},
            {'name': 'Environment', 'category': categories[6], 'priority': 3},
            
            # Computer & IT
            {'name': 'Computer Fundamentals', 'category': categories[7], 'priority': 1},
            {'name': 'Programming', 'category': categories[7], 'priority': 2},
            {'name': 'Internet & Networking', 'category': categories[7], 'priority': 3},
        ]
        
        subjects = []
        for sub_data in subjects_data:
            subject, created = Subject.objects.get_or_create(
                name=sub_data['name'],
                category=sub_data['category'],
                defaults={'priority': sub_data['priority']}
            )
            subjects.append(subject)
            if created:
                self.stdout.write(f'Created subject: {subject.name}')
        
        return subjects
    
    def create_questions(self, subjects, num_questions):
        questions = []
        question_types = ['mcq', 'true_false']
        difficulties = ['easy', 'medium', 'hard']
        
        bangla_questions = [
            "『সবার উপরে মানুষ সত্য, তাহার উপরে নাই』 - এই উক্তিটি কার?",
            "বাংলা সাহিত্যের প্রথম মুসলিম নাট্যকার কে?",
            "『পদ্মাবতী』 কাব্যের রচয়িতা কে?",
            "বাংলা ভাষার উদ্ভব হয়েছে কোন ভাষা থেকে?",
            "রবীন্দ্রনাথ ঠাকুরের 'গীতাঞ্জলি' এর ইংরেজি অনুবাদের নাম কি?"
        ]
        
        english_questions = [
            "Choose the correct synonym of 'Benevolent'",
            "Which sentence is in passive voice?",
            "What is the plural form of 'criterion'?",
            "Identify the correct preposition: He is good __ Mathematics.",
            "Which word is misspelled?"
        ]
        
        bd_affairs_questions = [
            "বাংলাদেশের সংবিধান কবে প্রথম প্রণয়ন করা হয়?",
            "বাংলাদেশের জাতীয় পশু কি?",
            "মুক্তিযুদ্ধে বীরশ্রেষ্ঠ খেতাবপ্রাপ্ত কয়জন?",
            "বাংলাদেশের প্রথম প্রধানমন্ত্রী কে ছিলেন?",
            "সোহরাওয়ার্দী উদ্যানের পূর্ব নাম কি ছিল?"
        ]
        
        science_questions = [
            "পৃথিবীর বায়ুমণ্ডলে কোন গ্যাসের পরিমাণ সবচেয়ে বেশি?",
            "মানবদেহের ক্ষুদ্রতম হাড় কোনটি?",
            "ফটোসিনথেসিস প্রক্রিয়ায় উদ্ভিদ কি উৎপন্ন করে?",
            "বৈদ্যুতিক বাল্বের ফিলামেন্ট কোন ধাতু দিয়ে তৈরি?",
            "এসিড বৃষ্টির জন্য দায়ী গ্যাস কোনটি?"
        ]
        
        math_questions = [
            "একটি ত্রিভুজের তিন কোণের সমষ্টি কত?",
            "১০০ থেকে ২০০ পর্যন্ত মৌলিক সংখ্যা কয়টি?",
            "লসাগু নির্ণয় কর: ১২, ১৮, ২৪",
            "একটি বর্গক্ষেত্রের কর্ণ ১০ সেমি হলে এর ক্ষেত্রফল কত?",
            "২, ৪, ৮, ১৬ ... ধারাটির পরবর্তী পদ কত?"
        ]
        
        all_question_templates = bangla_questions + english_questions + bd_affairs_questions + science_questions + math_questions
        
        for i in range(num_questions):
            subject = random.choice(subjects)
            question_type = random.choice(question_types)
            difficulty = random.choice(difficulties)
            
            if question_type == 'true_false':
                question_text = f"{fake.sentence()} (True/False)"
                explanation = "This is a true/false question about the topic."
            else:
                if i < len(all_question_templates):
                    question_text = all_question_templates[i]
                else:
                    question_text = f"{subject.name} সম্পর্কিত প্রশ্ন: {fake.sentence()}"
                explanation = f"{subject.name} বিষয়ের উপর ভিত্তি করে এই প্রশ্নটি তৈরি করা হয়েছে।"
            
            question = Question.objects.create(
                subject=subject,
                question_text=question_text,
                question_type=question_type,
                difficulty=difficulty,
                explanation=explanation,
                marks=1,
                negative_marks=0.25 if random.random() > 0.7 else 0.0,
                is_active=True
            )
            
            # Create options
            if question_type == 'true_false':
                options_data = [
                    {'option_text': 'True', 'is_correct': True, 'order': 1},
                    {'option_text': 'False', 'is_correct': False, 'order': 2},
                ]
            else:
                correct_option = fake.sentence()
                options_data = [
                    {'option_text': correct_option, 'is_correct': True, 'order': 1},
                    {'option_text': fake.sentence(), 'is_correct': False, 'order': 2},
                    {'option_text': fake.sentence(), 'is_correct': False, 'order': 3},
                    {'option_text': fake.sentence(), 'is_correct': False, 'order': 4},
                ]
                random.shuffle(options_data)
                for j, opt_data in enumerate(options_data):
                    opt_data['order'] = j + 1
            
            for opt_data in options_data:
                Option.objects.create(
                    question=question,
                    option_text=opt_data['option_text'],
                    is_correct=opt_data['is_correct'],
                    order=opt_data['order']
                )
            
            questions.append(question)
        
        self.stdout.write(f'Created {len(questions)} questions')
        return questions
    
    def create_users(self, num_users):
        users = []
        user_types = ['student', 'teacher', 'admin']
        
        # Create some specific users
        specific_users = [
            {'username': 'admin', 'email': 'admin@bcsapp.com', 'user_type': 'admin', 'is_staff': True, 'is_superuser': True},
            {'username': 'teacher1', 'email': 'teacher1@bcsapp.com', 'user_type': 'teacher', 'first_name': 'আনিস', 'last_name': 'আহমেদ'},
            {'username': 'student1', 'email': 'student1@bcsapp.com', 'user_type': 'student', 'first_name': 'রহিম', 'last_name': 'খান'},
            {'username': 'premium_user', 'email': 'premium@bcsapp.com', 'user_type': 'student', 'first_name': 'সুমন', 'last_name': 'দাস', 'is_premium': True},
        ]
        
        for user_data in specific_users:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password='password123',
                    user_type=user_data['user_type'],
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    is_staff=user_data.get('is_staff', False),
                    is_superuser=user_data.get('is_superuser', False),
                    is_premium=user_data.get('is_premium', False)
                )
                users.append(user)
                self.stdout.write(f'Created user: {user.username}')
        
        # Create random users
        for i in range(num_users - len(specific_users)):
            username = f"user_{i+1}"
            email = f"user_{i+1}@bcsapp.com"
            user_type = random.choice(user_types)
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password='password123',
                user_type=user_type,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone=fake.phone_number()[:15],
                date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=35),
                is_premium=random.random() > 0.8  # 20% premium users
            )
            
            # Update user profile (automatically created by signal)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.bio = fake.text(max_nb_chars=200)
            profile.address = fake.address()
            profile.education = random.choice(['SSC', 'HSC', 'BSc', 'MSc', 'PhD'])
            profile.profession = random.choice(['Student', 'Teacher', 'Engineer', 'Doctor', 'Business'])
            profile.social_links = {'facebook': f'https://facebook.com/{username}', 'twitter': f'https://twitter.com/{username}'}
            profile.save()
            
            users.append(user)
        
        self.stdout.write(f'Created {len(users)} users')
        return users
    
    def create_quizzes(self, subjects):
        quizzes_data = [
            {
                'title': 'BCS Preliminary Model Test 1',
                'description': 'Complete BCS preliminary exam simulation',
                'time_limit': 120,
                'total_questions': 100,
                'total_marks': 100,
                'negative_marking': True,
                'is_published': True
            },
            {
                'title': 'Bangla Literature Practice Test',
                'description': 'Focus on Bangla language and literature',
                'time_limit': 60,
                'total_questions': 50,
                'total_marks': 50,
                'negative_marking': False,
                'is_published': True
            },
            {
                'title': 'English Grammar Quiz',
                'description': 'Test your English grammar skills',
                'time_limit': 45,
                'total_questions': 30,
                'total_marks': 30,
                'negative_marking': False,
                'is_published': True
            },
            {
                'title': 'Bangladesh Affairs Test',
                'description': 'History and current affairs of Bangladesh',
                'time_limit': 60,
                'total_questions': 40,
                'total_marks': 40,
                'negative_marking': True,
                'is_published': True
            },
            {
                'title': 'General Science Assessment',
                'description': 'Physics, Chemistry, and Biology questions',
                'time_limit': 50,
                'total_questions': 35,
                'total_marks': 35,
                'negative_marking': False,
                'is_published': True
            }
        ]
        
        quizzes = []
        for quiz_data in quizzes_data:
            quiz = Quiz.objects.create(**quiz_data)
            
            # Add random subjects to quiz
            num_subjects = random.randint(3, 8)
            quiz_subjects = random.sample(subjects, num_subjects)
            quiz.subjects.set(quiz_subjects)
            
            quizzes.append(quiz)
            self.stdout.write(f'Created quiz: {quiz.title}')
        
        return quizzes
    
    def create_quiz_data(self, users, quizzes, questions):
        self.stdout.write('Creating quiz attempts and user progress...')
        
        for user in users:
            if user.user_type != 'student':
                continue
            
            # Create user progress for each subject
            for subject in Subject.objects.all():
                attempted = random.randint(0, 50)
                correct = random.randint(0, attempted)
                accuracy = (correct / attempted * 100) if attempted > 0 else 0
                
                UserProgress.objects.get_or_create(
                    user=user,
                    subject=subject,
                    defaults={
                        'total_questions': subject.questions.count(),
                        'attempted_questions': attempted,
                        'correct_answers': correct,
                        'accuracy': accuracy,
                        'last_attempt': timezone.make_aware(fake.date_time_this_year()) if attempted > 0 else None
                    }
                )
            
            # Create quiz attempts
            for quiz in quizzes:
                if random.random() > 0.3:  # 70% chance to attempt each quiz
                    started_at = timezone.make_aware(fake.date_time_this_year())
                    is_completed = random.random() > 0.2  # 80% completion rate
                    
                    attempt = QuizAttempt.objects.create(
                        user=user,
                        quiz=quiz,
                        started_at=started_at,
                        completed_at=started_at + timedelta(minutes=random.randint(10, quiz.time_limit)) if is_completed else None,
                        score=random.uniform(0, quiz.total_marks) if is_completed else 0,
                        total_marks=quiz.total_marks,
                        time_taken=random.randint(300, quiz.time_limit * 60),
                        is_completed=is_completed
                    )
                    
                    # Create user answers for this attempt
                    if is_completed:
                        quiz_subjects = set(quiz.subjects.all())
                        quiz_questions = [q for q in questions if q.subject in quiz_subjects][:quiz.total_questions]
                        for question in quiz_questions:
                            correct_options = list(question.options.filter(is_correct=True))
                            selected_options = []
                            
                            # Simulate user answer (sometimes correct, sometimes wrong)
                            if random.random() > 0.4:  # 60% correct answers
                                selected_options = correct_options
                                is_correct = True
                                marks_obtained = question.marks
                            else:
                                wrong_options = list(question.options.filter(is_correct=False))
                                if wrong_options:
                                    selected_options = random.sample(wrong_options, min(1, len(wrong_options)))
                                is_correct = False
                                marks_obtained = -float(question.negative_marks) if quiz.negative_marking else 0
                            
                            user_answer = UserAnswer.objects.create(
                                attempt=attempt,
                                question=question,
                                is_correct=is_correct,
                                marks_obtained=marks_obtained
                            )
                            user_answer.selected_options.set(selected_options)
        
        self.stdout.write('Created quiz attempts and user progress')
    
    def create_discussions(self, users, questions):
        self.stdout.write('Creating discussions...')
        
        for question in random.sample(questions, min(100, len(questions))):
            # Create main discussion
            main_discussion = Discussion.objects.create(
                title=question.question_text[:200],
                user=random.choice(users),
                comment=fake.paragraph(nb_sentences=3),
                created_at=timezone.make_aware(fake.date_time_this_year())
            )
            
            # Create some replies
            for _ in range(random.randint(0, 5)):
                Discussion.objects.create(
                    title=f"Re: {main_discussion.title}"[:200],
                    user=random.choice(users),
                    comment=fake.sentence(),
                    parent=main_discussion,
                    created_at=timezone.make_aware(fake.date_time_this_year())
                )
        
        self.stdout.write('Created discussions')
    
    def create_payment_data(self, users):
        self.stdout.write('Creating payment data...')
        
        # Create payment plans if they don't exist
        plans_data = [
            {
                'name': 'BCS Basic',
                'plan_type': 'basic',
                'description': 'Perfect for beginners starting their BCS preparation',
                'price': 299.00,
                'original_price': 399.00,
                'duration_days': 30,
                'features': ['Access to basic quizzes', '500+ practice questions', 'Basic analytics', 'Email support'],
                'is_popular': False,
                'is_active': True
            },
            {
                'name': 'BCS Premium',
                'plan_type': 'premium',
                'description': 'Most popular choice for serious BCS aspirants',
                'price': 799.00,
                'original_price': 999.00,
                'duration_days': 90,
                'features': ['Unlimited quiz access', '5000+ practice questions', 'Advanced analytics', 'Priority support', 'Mock test series'],
                'is_popular': True,
                'is_active': True
            },
            {
                'name': 'BCS Gold',
                'plan_type': 'gold',
                'description': 'Complete preparation package with expert guidance',
                'price': 1499.00,
                'duration_days': 180,
                'features': ['Everything in Premium', 'Expert video lectures', 'Personalized study plan', 'One-on-one doubt sessions'],
                'is_popular': False,
                'is_active': True
            }
        ]
        
        plans = []
        for plan_data in plans_data:
            plan, created = PaymentPlan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            plans.append(plan)
        
        # Create coupons
        coupons_data = [
            {
                'code': 'WELCOME20',
                'description': 'Welcome discount for new users',
                'coupon_type': 'percentage',
                'discount_value': 20,
                'max_discount': 500.00,
                'min_purchase_amount': 500.00,
                'valid_from': timezone.now() - timedelta(days=30),
                'valid_to': timezone.now() + timedelta(days=330),
                'max_uses': 1000,
                'is_active': True
            },
            {
                'code': 'BCS2024',
                'description': 'Special discount for BCS 2024 aspirants',
                'coupon_type': 'fixed',
                'discount_value': 200.00,
                'min_purchase_amount': 1000.00,
                'valid_from': timezone.now() - timedelta(days=15),
                'valid_to': timezone.now() + timedelta(days=180),
                'max_uses': 500,
                'is_active': True
            }
        ]
        
        coupons = []
        for coupon_data in coupons_data:
            coupon, created = Coupon.objects.get_or_create(
                code=coupon_data['code'],
                defaults=coupon_data
            )
            coupons.append(coupon)
        
        # Create payments and subscriptions for premium users
        for user in users:
            if user.is_premium and random.random() > 0.3:
                plan = random.choice(plans)
                payment = Payment.objects.create(
                    user=user,
                    plan=plan,
                    amount=plan.price,
                    payment_id=f"pay_{fake.uuid4()}"[:100],
                    status='completed',
                    payment_method=random.choice(['stripe', 'bkash', 'nagad']),
                    completed_at=timezone.make_aware(fake.date_time_this_year()),
                    metadata={'discount_applied': random.random() > 0.7}
                )
                
                # Create subscription
                start_date = payment.completed_at
                UserSubscription.objects.create(
                    user=user,
                    plan_type=plan.plan_type,
                    payment=payment,
                    start_date=start_date,
                    end_date=start_date + timedelta(days=plan.duration_days),
                    status='active',
                    is_active=True,
                    auto_renew=random.random() > 0.5
                )
                
                # Sometimes use coupon
                if random.random() > 0.7 and coupons:
                    coupon = random.choice(coupons)
                    CouponUsage.objects.create(
                        coupon=coupon,
                        user=user,
                        payment=payment,
                        discount_amount=coupon.calculate_discount(plan.price)
                    )
                    coupon.used_count += 1
                    coupon.save()
        
        self.stdout.write('Created payment data')