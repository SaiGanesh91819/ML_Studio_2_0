from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, OTPVerification, Dataset, Experiment, TrainingRun



class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = '__all__'
        read_only_fields = ('project', 'uploaded_at', 'columns', 'row_count')

    file_size = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    def get_file_size(self, obj):
        try:
            if obj.file:
                size_bytes = obj.file.size
                if size_bytes < 1024:
                    return f"{size_bytes} B"
                elif size_bytes < 1024 * 1024:
                    return f"{size_bytes / 1024:.1f} KB"
                else:
                    return f"{size_bytes / (1024 * 1024):.1f} MB"
        except:
            pass
        return "Unknown"

    def get_download_url(self, obj):
        try:
            request = self.context.get('request')
            url = obj.file.url
            if request:
                return request.build_absolute_uri(url)
            return url
        except:
            return None

class ExperimentSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    metrics = serializers.SerializerMethodField()
    latest_run_id = serializers.SerializerMethodField()

    class Meta:
        model = Experiment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_status(self, obj):
        latest_run = obj.runs.order_by('-created_at').first()
        return latest_run.status if latest_run else "Pending"

    def get_metrics(self, obj):
        latest_run = obj.runs.order_by('-created_at').first()
        return latest_run.metrics if latest_run else {}

    def get_latest_run_id(self, obj):
        latest_run = obj.runs.order_by('-created_at').first()
        return latest_run.id if latest_run else None

class TrainingRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRun
        fields = '__all__'
        read_only_fields = ('started_at', 'completed_at', 'logs', 'metrics', 'model_file')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    otp = serializers.CharField(write_only=True) # Require OTP for registration

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'otp')

    def validate(self, attrs):
        # Validate Password Strength (Simple check for now)
        password = attrs.get('password')
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        
        # Validate OTP
        email = attrs.get('email')
        otp = attrs.get('otp')
        try:
            record = OTPVerification.objects.filter(email=email).latest('created_at')
            if record.otp != otp:
                raise serializers.ValidationError({"otp": "Invalid OTP."})
        except OTPVerification.DoesNotExist:
             raise serializers.ValidationError({"otp": "No OTP sent to this email."})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('otp') # Don't save OTP to user model
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

class ProjectSerializer(serializers.ModelSerializer):
    dataset_file = serializers.FileField(required=False) 

    class Meta:
        model = Project
        fields = '__all__'

    def validate_dataset_file(self, value):
        limit_mb = 10
        if value and value.size > limit_mb * 1024 * 1024:
            raise serializers.ValidationError(f"File size too large. Limit is {limit_mb}MB")
        return value

# Clean up: Removed simple FileUploadSerializer as ProjectSerializer handles it now


class PreprocessRequestSerializer(serializers.Serializer):
    steps = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )
