from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

  dependencies = [
    ('courses', '0003_courserubrictemplate_assignment_rubric_template'),
    migrations.swappable_dependency(settings.AUTH_USER_MODEL),
  ]

  operations = [
    migrations.CreateModel(
      name='AssignmentDiscussionPost',
      fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('body', models.TextField()),
        ('created_at', models.DateTimeField(auto_now_add=True)),
        ('updated_at', models.DateTimeField(auto_now=True)),
        ('assignment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='discussion_posts', to='courses.assignment')),
        ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assignment_discussion_posts', to=settings.AUTH_USER_MODEL)),
      ],
      options={'ordering': ['created_at']},
    ),
  ]
