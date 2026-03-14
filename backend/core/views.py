import random
import time
import threading
import json
from django.core.files.base import ContentFile
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Sum, Avg
from django.db.models.functions import TruncDate
from django.contrib.auth.models import User

from .models import Project, OTPVerification, Dataset, Experiment, TrainingRun
from .serializers import (
    ProjectSerializer, RegisterSerializer, SendOTPSerializer,
    DatasetSerializer, ExperimentSerializer, TrainingRunSerializer,
    PreprocessRequestSerializer
)

# ... (Auth Views remain same) ...

class SendOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = str(random.randint(100000, 999999))
            
            OTPVerification.objects.create(email=email, otp=otp)
            
            # Send Email
            print(f"Sending OTP {otp} to {email}") # Mock email for now
            # send_mail(
            #     'ML Studio - Verify your email',
            #     f'Your verification code is: {otp}',
            #     'noreply@mlstudio.com',
            #     [email],
            #     fail_silently=False,
            # )
            
            return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email
        })

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Projects
        user_projects = Project.objects.filter(user=user)
        active_projects_count = user_projects.filter(status='Active').count()
        
        # 2. Experiments & Runs
        user_experiments = Experiment.objects.filter(project__in=user_projects)
        all_user_runs = TrainingRun.objects.filter(experiment__in=user_experiments)
        completed_runs = all_user_runs.filter(status='Completed')
        
        models_trained_count = completed_runs.count()
        
        # 3. Compute Hours (estimation based on run duration)
        total_seconds = 0
        for run in completed_runs:
            delta = run.updated_at - run.created_at
            total_seconds += delta.total_seconds()
        
        compute_hours = round(total_seconds / 3600, 1)
        
        # 4. Avg Accuracy
        total_accuracy = 0
        accuracy_count = 0
        for run in completed_runs:
            acc = run.metrics.get('accuracy') or run.metrics.get('r2')
            if acc is not None:
                total_accuracy += acc
                accuracy_count += 1
        
        avg_accuracy = round((total_accuracy / accuracy_count) * 100, 1) if accuracy_count > 0 else 0
        
        # 5. Recent Activity
        recent_runs = all_user_runs.order_by('-updated_at')[:5]
        recent_activity = []
        for run in recent_runs:
            recent_activity.append({
                'id': run.id,
                'experiment_name': run.experiment.name,
                'status': run.status,
                'updated_at': run.updated_at.isoformat(),
                'type': 'run'
            })

        # 6. Heatmap Data (Runs per day)
        heatmap_data = (
            all_user_runs
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        heatmap = {str(item['date']): item['count'] for item in heatmap_data}

        # 7. Real Storage Usage
        user_datasets = Dataset.objects.filter(project__in=user_projects)
        total_bytes = 0
        for ds in user_datasets:
            try:
                total_bytes += ds.file.size
            except:
                pass
        
        storage_gb = round(total_bytes / (1024 * 1024 * 1024), 2)
        storage_usage_pct = min(int((storage_gb / 1024) * 100), 100) # 1TB limit

        return Response({
            'stats': [
                { 'id': 1, 'label': 'Active Projects', 'value': str(active_projects_count), 'icon': 'Box', 'color': '#3b82f6' },
                { 'id': 2, 'label': 'Models Trained', 'value': str(models_trained_count), 'icon': 'Cpu', 'color': '#8b5cf6' },
                { 'id': 3, 'label': 'Compute Hours', 'value': f"{compute_hours}h", 'icon': 'Zap', 'color': '#f59e0b' },
                { 'id': 4, 'label': 'Avg Accuracy', 'value': f"{avg_accuracy}%", 'icon': 'Activity', 'color': '#10b981' },
            ],
            'recent_activity': recent_activity,
            'heatmap': heatmap,
            'resources': [
                { 'name': 'GPU Quota (A100)', 'usage': min(int(compute_hours/1.2 * 100), 100) if compute_hours > 0 else 0, 'limit': '120h', 'used': f"{compute_hours}h" },
                { 'name': 'Storage (SSD)', 'usage': storage_usage_pct, 'limit': '1TB', 'used': f"{storage_gb}GB" },
                { 'name': 'API Requests', 'usage': (all_user_runs.count() % 100), 'limit': '100k', 'used': f"{all_user_runs.count() * 1.2:.1f}k" }
            ]
        })

class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        data = request.data
        
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        if 'display_name' in data:
            names = data['display_name'].split(' ', 1)
            user.first_name = names[0]
            user.last_name = names[1] if len(names) > 1 else ""
            
        user.save()
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "display_name": f"{user.first_name} {user.last_name}".strip()
        })

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({"error": "Incorrect current password"}, status=400)
        
        if len(new_password) < 8:
            return Response({"error": "New password must be at least 8 characters"}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password changed successfully"})

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username required"}, status=400)
        
        exists = User.objects.filter(username=username).exists()
        return Response({"exists": exists, "message": "Username taken" if exists else "Username available"})

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# ... imports ...
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder, Normalizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.svm import SVR, SVC
from sklearn.metrics import (
    accuracy_score, mean_squared_error, r2_score, 
    precision_score, recall_score, f1_score, confusion_matrix,
    mean_absolute_error
)
import joblib
import io
import os

# ... imports ...

class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Dataset.objects.filter(project__user=self.request.user)
        
        project_id = self.request.query_params.get('project_id')
        search = self.request.query_params.get('search')
        sort = self.request.query_params.get('sort', '-uploaded_at')

        if project_id and project_id != 'undefined':
            queryset = queryset.filter(project_id=project_id)
        
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Map frontend sort keys to backend fields
        sort_map = {
            'newest': '-uploaded_at',
            'oldest': 'uploaded_at',
            'name': 'name',
            'size': '-row_count'
        }
        order_by = sort_map.get(sort, '-uploaded_at')
        
        return queryset.order_by(order_by)

    def perform_create(self, serializer):
        print(f"Request Data: {self.request.data}") # Debug log
        project_id = self.request.data.get('project')
        
        if not project_id:
             raise serializers.ValidationError({"project": f"Project ID is required. Received: {self.request.data.keys()}"})
        
        # Save initial instance to get file path
        instance = serializer.save(project_id=project_id)
        
        try:
            # Process with Pandas
            df = pd.read_csv(instance.file.path) # Assuming CSV for now
            
            # Metadata
            instance.row_count = len(df)
            columns = []
            for col in df.columns:
                dtype = str(df[col].dtype)
                columns.append({"name": col, "type": dtype})
            instance.columns = columns
            
            # Statistics
            # Statistics
            # Statistics
            stats = self._calculate_detailed_stats(df)
            
            # Helper for NaN cleaning
            def clean_nan(obj):
                if isinstance(obj, dict):
                    return {k: clean_nan(v) for k, v in obj.items()}
                elif isinstance(obj, float) and (pd.isna(obj) or np.isinf(obj)):
                    return None
                return obj
                
            instance.statistics = clean_nan(stats)
            instance.save()
            
        except Exception as e:
            print(f"Error processing dataset: {e}")
            # Fallback to defaults if processing fails
            instance.row_count = 0
            instance.statistics = {"error": str(e)}
            instance.save()

    def _calculate_detailed_stats(self, df):
        stats = {}
        for col in df.columns:
            col_data = df[col]
            dtype = str(col_data.dtype)
            col_stats = {
                "data_type": dtype,
                "missing_count": int(col_data.isna().sum()),
                "missing_percentage": float(col_data.isna().mean() * 100),
                "unique_count": int(col_data.nunique()),
                "unique_percentage": float((col_data.nunique() / len(df)) * 100) if len(df) > 0 else 0
            }

            if pd.api.types.is_numeric_dtype(col_data):
                clean_data = col_data.dropna()
                if not clean_data.empty:
                    quantiles = clean_data.quantile([0.25, 0.5, 0.75]).to_dict()
                    iqr = quantiles[0.75] - quantiles[0.25]
                    col_stats.update({
                        "mean": float(clean_data.mean()),
                        "median": float(clean_data.median()),
                        "std": float(clean_data.std()),
                        "variance": float(clean_data.var()),
                        "min": float(clean_data.min()),
                        "max": float(clean_data.max()),
                        "range": float(clean_data.max() - clean_data.min()),
                        "iqr": float(iqr),
                        "skewness": float(clean_data.skew()),
                        "kurtosis": float(clean_data.kurt()),
                        "q1": float(quantiles[0.25]),
                        "q2": float(quantiles[0.5]),
                        "q3": float(quantiles[0.75]),
                    })
            
            elif pd.api.types.is_object_dtype(col_data) or pd.api.types.is_categorical_dtype(col_data) or pd.api.types.is_bool_dtype(col_data):
                # Categorical / Boolean
                if pd.api.types.is_bool_dtype(col_data):
                        vc = col_data.value_counts(normalize=True)
                        col_stats.update({
                            "true_count": int(col_data.sum()),
                            "true_percentage": float(vc.get(True, 0) * 100),
                            "false_count": int((~col_data).sum()),
                            "false_percentage": float(vc.get(False, 0) * 100)
                        })
                
                # Top Categories for both object/bool
                top_counts = col_data.value_counts().head(5)
                top_cats = []
                for val, count in top_counts.items():
                    top_cats.append({
                        "value": str(val),
                        "count": int(count),
                        "percentage": float((count / len(df)) * 100) if len(df) > 0 else 0
                    })
                col_stats["top_categories"] = top_cats
                
                if pd.api.types.is_datetime64_any_dtype(col_data):
                    col_stats["earliest"] = str(col_data.min())
                    col_stats["latest"] = str(col_data.max())

            stats[col] = col_stats
        
        # Dataset wide stats
        stats["dataset_stats"] = {
            "total_rows": len(df),
            "total_columns": len(df.columns)
        }
        return stats

    @action(detail=True, methods=['post'])
    def refresh_stats(self, request, pk=None):
        """Manually trigger stats recalculation for an existing dataset"""
        dataset = self.get_object()
        print(f"DEBUG: Processing refresh_stats for dataset {dataset.name}")
        try:
            df = pd.read_csv(dataset.file.path)
            stats = self._calculate_detailed_stats(df)
            print(f"DEBUG: Calculated Stats Keys: {stats.keys()}")
            
            # Helper for NaN cleaning (duplicate, could move to class method)
            def clean_nan(obj):
                if isinstance(obj, dict):
                    return {k: clean_nan(v) for k, v in obj.items()}
                elif isinstance(obj, float) and (pd.isna(obj) or np.isinf(obj)):
                    return None
                return obj
            
            dataset.statistics = clean_nan(stats)
            dataset.save()
            return Response(dataset.statistics)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


    @action(detail=True, methods=['post'])
    def preprocess(self, request, pk=None):
        dataset = self.get_object()
        serializer = PreprocessRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
            
        try:
            df = pd.read_csv(dataset.file.path)
            steps = serializer.validated_data['steps']
            
            for index, step in enumerate(steps):
                op_type = step.get('type')
                print(f"DEBUG: Executing Step {index+1}: {op_type} Config: {step}")
                
                # 1. Handle Missing Values
                if op_type in ['impute', 'imputation']:
                    strategy = step.get('strategy', 'mean')
                    cols = step.get('columns', [])
                    fill_value = step.get('fill_value')
                    
                    if not cols: 
                        # Fallback for single column key from frontend if array not sent
                        single = step.get('column')
                        if single: cols = [single]

                    if cols:
                        if strategy in ['drop', 'drop_rows']:
                            df.dropna(subset=cols, inplace=True)
                        else:
                            sk_strat = strategy
                            if strategy == 'mode': sk_strat = 'most_frequent'
                            if strategy == 'constant' and fill_value is None: fill_value = 0
                            
                            imputer = SimpleImputer(strategy=sk_strat, fill_value=fill_value)
                            valid_cols = [c for c in cols if c in df.columns]
                            if valid_cols:
                                df[valid_cols] = imputer.fit_transform(df[valid_cols])
                
                # 2. Cleaning actions
                elif op_type in ['cleaning', 'clean']:
                    action = step.get('action') 
                    
                    if action == 'drop_duplicates':
                        df.drop_duplicates(inplace=True)
                    
                    elif action == 'rename':
                        col = step.get('column')
                        new_name = step.get('new_name')
                        if col and new_name and col in df.columns:
                            df.rename(columns={col: new_name}, inplace=True)
                            
                    elif action == 'cast':
                        pass
                
                # 3. Encoding
                elif op_type in ['encode', 'encoding']:
                    method = step.get('method', 'label')
                    cols = step.get('columns', [])
                    if not cols: 
                        single = step.get('column')
                        if single: cols = [single]
                    
                    valid_cols = [c for c in cols if c in df.columns]
                    for col in valid_cols:
                        if method == 'label':
                            le = LabelEncoder()
                            df[col] = le.fit_transform(df[col].astype(str))
                        elif method == 'onehot':
                             dummies = pd.get_dummies(df[col], prefix=col)
                             df = pd.concat([df, dummies], axis=1)
                             df.drop(col, axis=1, inplace=True)

                # 4. Scaling/Normalization (Frontend uses 'normalization' for Scalers)
                elif op_type in ['scale', 'normalization', 'normalize']:
                    method = step.get('method', 'minmax')
                    cols = step.get('columns', [])
                    
                    if not cols:
                         cols = df.select_dtypes(include=[np.number]).columns.tolist()

                    valid_cols = [c for c in cols if c in df.columns]
                    if valid_cols:
                         print(f"DEBUG: Normalizing {valid_cols} with {method}") 
                         if method == 'minmax':
                             scaler = MinMaxScaler()
                         elif method == 'standard':
                             scaler = StandardScaler()
                         elif method == 'robust':
                             from sklearn.preprocessing import RobustScaler
                             scaler = RobustScaler()
                         else:
                             scaler = MinMaxScaler()
                             
                         df[valid_cols] = scaler.fit_transform(df[valid_cols])

            # Save as NEW Dataset
            new_file_name = f"processed_{int(time.time())}_{dataset.file.name.split('/')[-1]}"
            new_csv_content = df.to_csv(index=False)
            
            # Determine new name: Dataset (Processed N)
            import re
            
            # Base pattern we want: "OrignalName (Processed)" or "OriginalName (Processed N)"
            # Cleaner: Always match the original name prefix
            base_name = dataset.name
            
            # If current dataset is already a processed version, strip the suffix to find the true original root
            # E.g. "Titanic (Processed)" -> "Titanic"
            # E.g. "Titanic (Processed 2)" -> "Titanic"
            root_match = re.match(r"^(.*) \(Processed(?: \d+)?\)$", base_name)
            if root_match:
                root_name = root_match.group(1)
            else:
                root_name = base_name
                
            # Find all existing variations in this project
            existing_names = Dataset.objects.filter(
                project=dataset.project, 
                name__startswith=f"{root_name} (Processed"
            ).values_list('name', flat=True)
            
            max_counter = 0
            found_base_processed = False
            
            for name in existing_names:
                if name == f"{root_name} (Processed)":
                    found_base_processed = True
                else:
                    # Check for " (Processed N)"
                    match = re.match(r"^.* \(Processed (\d+)\)$", name)
                    if match:
                        num = int(match.group(1))
                        if num > max_counter: max_counter = num
            
            if max_counter == 0 and not found_base_processed:
                new_dataset_name = f"{root_name} (Processed)"
            else:
                # If "Processed" exists, next is "Processed 1" (or user requested 1 explicitly?)
                # User says: "we have tio show (preprocessed) and the number too"
                # implying even the first one should be numbered? Or sequential?
                # Usually standard is: "Name (Processed)", then "Name (Processed 1)" or "2".
                # Let's start counter at max_counter + 1.
                # If only "Processed" exists (counts as 0), next is 1. 
                # If "Processed 1" exists, next is 2.
                next_val = max(1, max_counter + 1)
                new_dataset_name = f"{root_name} (Processed {next_val})"
            
            new_dataset = Dataset(
                project=dataset.project,
                name=new_dataset_name,
                row_count=len(df),
                columns=[{"name": c, "type": str(df[c].dtype)} for c in df.columns],
                statistics=self._calculate_detailed_stats(df)
            )
            new_dataset.file.save(new_file_name, ContentFile(new_csv_content))
            new_dataset.save()
            
            return Response(DatasetSerializer(new_dataset).data)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        dataset = self.get_object()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        
        try:
            df = pd.read_csv(dataset.file.path)
            total_rows = len(df)
            start = (page - 1) * page_size
            end = start + page_size
            
            # Slice and fill NaNs
            data = df.iloc[start:end].fillna("").to_dict(orient='records')
            
            return Response({
                "data": data,
                "total": total_rows,
                "page": page,
                "page_size": page_size,
                "columns": list(df.columns)
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def correlation(self, request, pk=None):
        dataset = self.get_object()
        try:
            df = pd.read_csv(dataset.file.path)
            # Filter numeric columns only
            numeric_df = df.select_dtypes(include=[np.number])
            
            if numeric_df.empty:
                return Response({"error": "No numeric columns found for correlation"}, status=400)
                
            # Compute correlation matrix
            # Replace NaN with 0 or None to ensure valid JSON
            corr_matrix = numeric_df.corr().replace({np.nan: None}).to_dict()
            return Response(corr_matrix)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=['post'])
    def update_content(self, request, pk=None):
        dataset = self.get_object()
        try:
            new_data = request.data.get('data')
            if not isinstance(new_data, list):
                 return Response({"error": "Data must be a list of objects"}, status=400)
            
            df = pd.DataFrame(new_data)
            
            # Save content
            csv_content = df.to_csv(index=False)
            # Re-save file to update content and trigger storage update
            # Using save(name, content) ensures django handles it
            old_name = dataset.file.name.split('/')[-1]
            dataset.file.save(old_name, ContentFile(csv_content))
            
            # Update meta
            dataset.row_count = len(df)
            dataset.columns = [{"name": c, "type": str(df[c].dtype)} for c in df.columns]
            dataset.statistics = self._calculate_detailed_stats(df)
            dataset.save()
            
            return Response(DatasetSerializer(dataset).data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class ExperimentViewSet(viewsets.ModelViewSet):
    queryset = Experiment.objects.all()
    serializer_class = ExperimentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return Experiment.objects.filter(project_id=project_id, project__user=self.request.user)
        return Experiment.objects.filter(project__user=self.request.user)

class TrainingRunViewSet(viewsets.ModelViewSet):
    queryset = TrainingRun.objects.all()
    serializer_class = TrainingRunSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = TrainingRun.objects.filter(experiment__project__user=user)
        
        experiment_id = self.request.query_params.get('experiment_id')
        project_id = self.request.query_params.get('project_id')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        if experiment_id:
            queryset = queryset.filter(experiment_id=experiment_id)
        if project_id:
            queryset = queryset.filter(experiment__project_id=project_id)
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(experiment__name__icontains=search)
            
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        run = self.get_object()
        if run.status == 'Running':
            return Response({"error": "Run already in progress"}, status=400)
        
        run.status = 'Running'
        
        # Log config
        params = request.data.get('parameters', {})
        dataset_id = request.data.get('dataset_id')
        
        run.logs = f"[System] Initializing training environment...\n"
        run.logs += f"[Config] Train/Test Split: {params.get('train_split', 0.8)}\n"
        run.logs += f"[Config] Parameters: {json.dumps(params, indent=2)}\n"
        
        run.save()
        
        # Update Experiment config with training parameters
        exp = run.experiment
        exp.config = params
        exp.save()
        
        # Start actual training in background thread
        thread = threading.Thread(target=self._run_training_process, args=(run.id, dataset_id, params))
        thread.daemon = True
        thread.start()
        
        return Response({"status": "Training started"})

    def _run_training_process(self, run_id, dataset_id, params):
        """Executes actual model training using scikit-learn."""
        try:
            run = TrainingRun.objects.get(id=run_id)
            model_name = run.experiment.model_type or "linear_regression"
            run.logs += f"[System] Initializing training for {model_name}...\n"
            run.logs += "[System] Loading dataset...\n"
            run.save()
            
            # 1. Load Dataset
            if not dataset_id:
                raise ValueError("Dataset ID is required to train a model.")
                
            dataset = Dataset.objects.get(id=dataset_id)
            df = pd.read_csv(dataset.file.path)
            
            target_col = params.get('target_column')
            feature_cols = params.get('feature_columns', [])
            train_split = float(params.get('train_split', 0.8))
            
            if not target_col or target_col not in df.columns:
                raise ValueError(f"Valid target column must be specified. Received: {target_col}")
            if not feature_cols:
                raise ValueError("Feature columns must be specified.")
                
            run.logs += f"[System] Target: {target_col}, Features: {len(feature_cols)}\n"
            
            # Simple automatic missing value handling for target & features
            df = df.dropna(subset=[target_col])
            # Ensure feature columns exist
            feature_cols = [c for c in feature_cols if c in df.columns]
            
            X = df[feature_cols].copy()
            y = df[target_col].copy()
            
            # Basic preprocessing (imputing and encoding)
            run.logs += "[System] Preprocessing data (encoding and imputation)...\n"
            run.save()
            
            # Extremely generic handling: label encode objects and store mappings
            categorical_mappings = {}
            for col in X.columns:
                # 1. First, try to convert to numeric if it's all numbers (strings of numbers)
                X[col] = pd.to_numeric(X[col], errors='ignore')
                
                # 2. Check if it's still non-numeric
                if not pd.api.types.is_numeric_dtype(X[col]):
                    le = LabelEncoder()
                    # Strip, Lower and Strip any whitespace for consistency
                    clean_series = X[col].astype(str).str.strip().str.lower()
                    X[col] = le.fit_transform(clean_series)
                    # Store mappings: { 'lowercased_label': int_code }
                    categorical_mappings[col] = {str(label): int(code) for code, label in enumerate(le.classes_)}
                else:
                    # Pure numeric: Handle NaNs
                    X[col] = X[col].fillna(X[col].mean())
            
            # Target encode for classification
            is_classification = model_name in ['logistic_regression', 'random_forest_classification', 'svc']
            if is_classification and str(y.dtype) == 'object':
                le_y = LabelEncoder()
                y = le_y.fit_transform(y.astype(str).str.strip().str.lower())
                categorical_mappings['__target__'] = {label: int(code) for code, label in enumerate(le_y.classes_)}
            
            run.metrics['categorical_mappings'] = categorical_mappings
            run.save()
                
            X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=train_split, random_state=42)
            
            # 2. Initialize Model
            run.logs += f"[System] Training model {model_name} with parameters...\n"
            run.save()
            
            if model_name == 'linear_regression':
                model = LinearRegression()
            elif model_name == 'logistic_regression':
                model = LogisticRegression(max_iter=1000)
            elif model_name == 'random_forest':
                n_ext = params.get('n_estimators', 100)
                n_ext = int(n_ext) if n_ext else 100
                m_dep = params.get('max_depth', None)
                m_dep = int(m_dep) if m_dep else None
                
                if is_classification or len(np.unique(y)) < 20: 
                    model = RandomForestClassifier(n_estimators=n_ext, max_depth=m_dep)
                else:
                    model = RandomForestRegressor(n_estimators=n_ext, max_depth=m_dep)
            elif model_name == 'svc':
                c_val = params.get('C', 1.0)
                c_val = float(c_val) if c_val else 1.0
                model = SVC(kernel=params.get('kernel', 'rbf'), C=c_val)
            else:
                raise ValueError(f"Model type '{model_name}' is not supported.")
                
            # 3. Train
            model.fit(X_train, y_train)
            run.logs += "[System] Training complete! Evaluating model...\n"
            run.save()
            
            # 4. Evaluate
            if isinstance(model, (LogisticRegression, RandomForestClassifier, SVC)):
                y_pred = model.predict(X_test)
                accuracy = accuracy_score(y_test, y_pred)
                
                # Use 'weighted' for multiclass support
                precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
                
                cm = confusion_matrix(y_test, y_pred)
                
                metrics = {
                    "accuracy": float(accuracy),
                    "precision": float(precision),
                    "recall": float(recall),
                    "f1_score": float(f1),
                    "confusion_matrix": cm.tolist()
                }
                
                run.logs += f"[Metrics] Accuracy: {accuracy:.4f}\n"
                run.logs += f"[Metrics] F1 Score: {f1:.4f}\n"
            else:
                y_pred = model.predict(X_test)
                mse = mean_squared_error(y_test, y_pred)
                rmse = np.sqrt(mse)
                mae = mean_absolute_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                metrics = {
                    "mse": float(mse),
                    "rmse": float(rmse),
                    "mae": float(mae),
                    "r2": float(r2)
                }
                run.logs += f"[Metrics] MSE: {mse:.4f}, R2: {r2:.4f}\n"
            
            # Merge new metrics with existing (like categorical_mappings)
            if not isinstance(run.metrics, dict):
                run.metrics = {}
            run.metrics.update(metrics)
            # Explicitly mark for saving to avoid JSONField update issues in some versions
            run.metrics = dict(run.metrics) 
            
            # 5. Save model artifact
            model_bytes = io.BytesIO()
            joblib.dump(model, model_bytes)
            model_bytes.seek(0)
            run.model_file.save(f"model_{run.id}.pkl", ContentFile(model_bytes.read()))
            
            run.status = 'Completed'
            run.logs += "[System] Model saved to artifacts.\n"
            run.save()
            
        except Exception as e:
            print(f"Training failed: {e}")
            try:
                run = TrainingRun.objects.get(id=run_id)
                run.status = 'Failed'
                run.logs += f"\n[Error] Training failed: {str(e)}\n"
                run.save()
            except:
                pass

    @action(detail=True, methods=['post'])
    def predict(self, request, pk=None):
        """Allows testing the model with custom input data."""
        run = self.get_object()
        if not run.model_file:
            return Response({"error": "Model not found for this run"}, status=404)
        
        try:
            # 1. Load Model
            model = joblib.load(run.model_file.path)
            
            # 2. Prepare Input
            input_data = request.data.get('input_data', {})
            if not input_data:
                return Response({"error": "No input data provided"}, status=400)
            
            # Get expected features from config
            features = run.experiment.config.get('feature_columns', [])
            if not features:
                 return Response({"error": "No features defined for this experiment config. Redo training."}, status=400)
            
            # Ensure input data matches features and is in correct order
            ordered_data = []
            categorical_mappings = run.metrics.get('categorical_mappings', {})
            
            for feat in features:
                val = input_data.get(feat, 0)
                
                # 1. Try to use explicit mappings from training
                if feat in categorical_mappings and isinstance(val, str):
                    low_val = str(val).lower().strip()
                    if low_val in categorical_mappings[feat]:
                        val = categorical_mappings[feat][low_val]
                
                # 2. Fallback heuristic for boolean strings
                if isinstance(val, str):
                    low_val = val.lower().strip()
                    if low_val in ['yes', 'true', 'y']:
                        val = 1
                    elif low_val in ['no', 'false', 'n']:
                        val = 0
                
                # 3. Try to cast to float
                try:
                    if val == "" or val is None:
                        val = 0.0
                    else:
                        val = float(val)
                except (ValueError, TypeError):
                    pass
                ordered_data.append(val)
            
            # Convert to DataFrame with explicit columns
            # Ensure all data is numeric if possible, or object if categorical
            df_input = pd.DataFrame([ordered_data], columns=features)
            
            # Force numeric conversion for everything that CAN be numeric
            for col in df_input.columns:
                df_input[col] = pd.to_numeric(df_input[col], errors='ignore')
            
            # 3. Predict
            prediction = model.predict(df_input)
            
            # 4. Handle probability if possible
            probability = None
            if hasattr(model, 'predict_proba'):
                prob_res = model.predict_proba(df_input)
                probability = prob_res.tolist()[0]
                
            return Response({
                "prediction": prediction.tolist()[0],
                "probability": probability
            })
            
        except Exception as e:
            error_msg = str(e)
            if "could not convert string to float" in error_msg.lower():
                return Response({
                    "error": f"Data conversion error: {error_msg}. The model expects numerical values for some features. Make sure categorical features are handled correctly or re-train the model with the latest dataset."
                }, status=400)
            return Response({"error": f"Prediction failed: {error_msg}"}, status=500)
