from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Archived', 'Archived'),
        ('Completed', 'Completed'),
    ]

    DOMAIN_CHOICES = [
        ('Tabular', 'Tabular Classification/Regression'),
        ('NLP', 'Natural Language Processing'),
        ('CV', 'Computer Vision'),
    ]

    # Owner
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES, default='Tabular')
    
    # Workspace Config
    settings = models.JSONField(default=dict, blank=True) 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class OTPVerification(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {self.otp}"

def dataset_upload_path(instance, filename):
    return f'datasets/project_{instance.project.id}/{filename}'

def model_upload_path(instance, filename):
    return f'models/run_{instance.id}/{filename}'

class Dataset(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='datasets')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=dataset_upload_path)
    columns = models.JSONField(default=list, blank=True) # Cached metadata: col names, types
    row_count = models.IntegerField(default=0)
    statistics = models.JSONField(default=dict, blank=True) # Detailed stats: mean, min, max, nulls
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.project.name})"

class Experiment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='experiments')
    name = models.CharField(max_length=255, default="New Experiment")
    
    # Standard ML: "RandomForest", "LinearRegression" etc.
    model_type = models.CharField(max_length=100, blank=True, null=True)
    
    # Deep Learning: The visual graph architecture
    nodes = models.JSONField(default=list, blank=True) 
    # Hyperparameters: epochs, batch_size, optimizer, learning_rate
    config = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TrainingRun(models.Model):
    STATUS_CHOICES = [
        ('Queued', 'Queued'),
        ('Running', 'Running'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
    ]
    
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name='runs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Queued')
    
    # Live logs from the "training process"
    logs = models.TextField(blank=True, default="")
    
    # Final metrics (accuracy, loss, etc)
    metrics = models.JSONField(default=dict, blank=True)
    
    # The trained model artifact
    model_file = models.FileField(upload_to=model_upload_path, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Run {self.id} - {self.experiment.name}"
