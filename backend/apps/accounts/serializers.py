from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('role', 'phone', 'address', 'date_of_birth')

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    address = serializers.CharField(source='profile.address', read_only=True)
    date_of_birth = serializers.DateField(source='profile.date_of_birth', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'address', 'date_of_birth', 'is_staff')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default='PASSENGER', required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone', 'address', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        role = validated_data.pop('role', 'PASSENGER')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        if role == 'ADMIN':
            user.is_staff = True
            user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.phone = phone
        profile.address = address
        profile.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth')

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        profile = instance.profile
        profile.phone = validated_data.get('phone', profile.phone)
        profile.address = validated_data.get('address', profile.address)
        if 'date_of_birth' in validated_data:
            profile.date_of_birth = validated_data.get('date_of_birth')
        profile.save()
        return instance
