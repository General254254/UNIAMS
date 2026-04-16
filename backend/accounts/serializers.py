from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    unit_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'password', 'role', 'unit_ids',
        ]

    def create(self, validated_data):
        from units.models import Unit
        unit_ids = validated_data.pop('unit_ids', [])
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if unit_ids:
            user.enrolled_units.set(Unit.objects.filter(id__in=unit_ids))
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    enrolled_units = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'enrolled_units',
        ]

    def get_enrolled_units(self, obj):
        return [
            {'id': u.id, 'code': u.code, 'name': u.name}
            for u in obj.enrolled_units.all()
        ]
